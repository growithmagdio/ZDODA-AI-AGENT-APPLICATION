"""
Zdoda Voice Engine worker.

Every call (browser or phone) gets its own job. The worker:
  1. asks the Zdoda API who the agent is (prompt, model, voice, tools, limits),
  2. runs a LiveKit AgentSession: Silero VAD -> Deepgram STT -> turn detector -> LLM -> TTS,
     with barge-in, knowledge-base lookups on every turn, tools, transfer and hang-up,
  3. streams the transcript back to the API and reports the call when it ends.

Run:  python -m livekit.agents start zdoda_voice/agent.py
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from typing import Any

from livekit import api, rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    ChatContext,
    ChatMessage,
    JobContext,
    JobProcess,
    RunContext,
    function_tool,
    get_job_context,
)
from livekit.plugins import silero

from zdoda_voice.api import ZdodaApi
from zdoda_voice.speech import build_llm, build_stt, build_tts, speakable

log = logging.getLogger("zdoda.voice")
AGENT_NAME = os.environ.get("VOICE_AGENT_NAME", "zdoda-voice")

try:  # the turn-detector model is optional (needs `download-files` at build time)
    from livekit.plugins.turn_detector.multilingual import MultilingualModel
except Exception:  # pragma: no cover
    MultilingualModel = None  # type: ignore


class ZdodaAgent(Agent):
    """One agent per call. Adds knowledge-base context before every reply."""

    def __init__(self, cfg: dict[str, Any], zapi: ZdodaApi, tools: list) -> None:
        super().__init__(instructions=cfg["instructions"], tools=tools)
        self.cfg = cfg
        self.zapi = zapi

    async def on_enter(self) -> None:
        if self.cfg.get("greetingFirst", True) and self.cfg.get("greeting"):
            await self.session.say(speakable(self.cfg["greeting"]), allow_interruptions=True)
        else:
            # Outbound call: wait for "hello?" then introduce yourself.
            self.session.generate_reply(instructions="The person just answered the phone. Greet them briefly, say who you are and why you are calling.")

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        if not self.cfg.get("useKnowledge", True):
            return
        query = (new_message.text_content or "").strip()
        if len(query) < 3:
            return
        context = await self.zapi.retrieve(self.cfg["workspaceId"], self.cfg["callId"], query)
        if context:
            turn_ctx.add_message(role="system", content=f"KNOWLEDGE (use only if relevant):\n{context[:6000]}")


def _dynamic_tools(cfg: dict[str, Any], zapi: ZdodaApi) -> list:
    """Workspace tools defined in the dashboard, executed by the API."""
    out = []
    for d in cfg.get("tools") or []:
        name = d["name"]
        speak = d.get("speakWhileRunning") or ""

        async def _call(context: RunContext, raw_arguments: dict[str, object], _name: str = name, _speak: str = speak) -> str:
            if _speak:
                context.session.say(_speak, allow_interruptions=False)
            res = await zapi.tool(cfg["workspaceId"], cfg["callId"], _name, dict(raw_arguments))
            return str(res.get("result", "Done."))

        out.append(function_tool(_call, raw_schema={"name": name, "description": d.get("description", name), "parameters": d.get("parameters") or {"type": "object", "properties": {}}}))
    return out


def _call_control_tools(cfg: dict[str, Any], zapi: ZdodaApi, state: dict[str, Any]) -> list:
    tools = []

    @function_tool(name="end_call", description="End the call politely when the caller is finished, says goodbye, or asks to hang up.")
    async def end_call(context: RunContext) -> str:
        state["reason"] = "agent_hangup"
        await context.wait_for_playout()
        asyncio.get_running_loop().call_later(1.5, lambda: get_job_context().shutdown("agent ended call"))
        return "Call ending."

    tools.append(end_call)

    if cfg.get("canTransfer"):

        @function_tool(name="transfer_to_human", description="Transfer the caller to a human team member when they ask for a person or the question needs staff.")
        async def transfer_to_human(context: RunContext) -> str:
            res = await zapi.tool(cfg["workspaceId"], cfg["callId"], "transfer_to_human", {})
            number = res.get("transferNumber")
            if not number:
                return "No transfer number is set up; offer to take a message instead."
            await context.session.say("Sure, connecting you to a team member now.", allow_interruptions=False)
            job = get_job_context()
            caller = next((p for p in job.room.remote_participants.values() if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP), None)
            if not caller:
                return "Transfer is only available on phone calls."
            state["reason"] = "transferred"
            try:
                await job.api.sip.transfer_sip_participant(
                    api.TransferSIPParticipantRequest(room_name=job.room.name, participant_identity=caller.identity, transfer_to=f"tel:{number}", play_dialtone=True)
                )
            except Exception as e:  # keep the call alive if transfer fails
                log.warning("transfer failed: %s", e)
                state["reason"] = "transfer_failed"
                return "The transfer failed. Apologise and offer to take a message."
            return "Transferred."

        tools.append(transfer_to_human)
    return tools


def prewarm(proc: JobProcess) -> None:
    proc.userdata["vad"] = silero.VAD.load()


server = AgentServer(setup_fnc=prewarm)


@server.rtc_session(agent_name=AGENT_NAME)
async def entrypoint(ctx: JobContext) -> None:
    zapi = ZdodaApi()
    await ctx.connect()

    # Work out who is calling and which number they dialled (phone calls).
    metadata = ctx.job.metadata or ""
    called = caller = None
    if not metadata:
        participant = await ctx.wait_for_participant()
        attrs = participant.attributes or {}
        called = attrs.get("sip.trunkPhoneNumber")
        caller = attrs.get("sip.phoneNumber")

    cfg = await zapi.session(ctx.room.name, metadata, called, caller)
    if not cfg.get("allowed"):
        # Speak a short message, then hang up (no AI cost).
        session = AgentSession(tts=build_tts({}, "en"), vad=ctx.proc.userdata["vad"])
        await session.start(room=ctx.room, agent=Agent(instructions="Say the message and stop."))
        await session.say(cfg.get("message") or "Sorry, this line is not available.", allow_interruptions=False)
        await asyncio.sleep(1)
        ctx.shutdown("not allowed")
        await zapi.aclose()
        return

    voice = cfg.get("voice") or {}
    state: dict[str, Any] = {"reason": "caller_hangup", "started": time.monotonic(), "buffer": []}

    turn_handling: dict[str, Any] = {"endpointing": {"min_delay": 0.4, "max_delay": 3.0}, "interruption": {"enabled": True}}
    if MultilingualModel is not None:
        turn_handling["turn_detection"] = MultilingualModel()

    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=build_stt(voice),
        llm=build_llm(cfg.get("model") or {}),
        tts=build_tts(voice, cfg.get("language")),
        turn_handling=turn_handling,
        user_away_timeout=float(voice.get("idleSeconds") or 20),
        max_tool_steps=4,
    )

    # Transcript -> API (batched every ~2s)
    @session.on("conversation_item_added")
    def _on_item(ev) -> None:
        item = ev.item
        role = getattr(item, "role", None)
        text = getattr(item, "text_content", None)
        if role in ("user", "assistant") and text:
            state["buffer"].append({"role": role, "text": text})
            phrases = [p.lower() for p in voice.get("endCallPhrases") or []]
            if role == "user" and any(p and p in text.lower() for p in phrases):
                state["reason"] = "caller_goodbye"

    async def _flush_loop() -> None:
        while True:
            await asyncio.sleep(2)
            items, state["buffer"] = state["buffer"], []
            await zapi.events(cfg["workspaceId"], cfg["callId"], items)

    flusher = asyncio.create_task(_flush_loop())

    # Idle handling: nudge once, then hang up.
    nudged = {"done": False}

    @session.on("user_state_changed")
    def _on_user_state(ev) -> None:
        if ev.new_state != "away":
            nudged["done"] = False
            return
        if not nudged["done"]:
            nudged["done"] = True
            session.say("Are you still there?", allow_interruptions=True)
        else:
            state["reason"] = "silence_timeout"
            ctx.shutdown("silence")

    async def _on_shutdown() -> None:
        flusher.cancel()
        items, state["buffer"] = state["buffer"], []
        await zapi.events(cfg["workspaceId"], cfg["callId"], items)
        await zapi.end(cfg["workspaceId"], cfg["callId"], time.monotonic() - state["started"], state["reason"])
        await zapi.aclose()

    ctx.add_shutdown_callback(_on_shutdown)

    tools = _call_control_tools(cfg, zapi, state) + _dynamic_tools(cfg, zapi)
    await session.start(room=ctx.room, agent=ZdodaAgent(cfg, zapi, tools))

    # Hard cap on call length (plan minutes and the agent's max duration).
    async def _max_duration() -> None:
        limit = int(cfg.get("maxDurationSec") or 900)
        await asyncio.sleep(max(limit - 20, 10))
        await session.say("We're nearly out of time for this call. Is there anything else quickly?", allow_interruptions=True)
        await asyncio.sleep(20)
        state["reason"] = "max_duration"
        ctx.shutdown("max duration")

    asyncio.create_task(_max_duration())


if __name__ == "__main__":
    from livekit.agents import cli

    cli.run_app(server)
