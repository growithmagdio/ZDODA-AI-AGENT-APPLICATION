"""Client for the Zdoda API's voice-worker endpoints (shared-secret auth)."""
from __future__ import annotations

import logging
import os
from typing import Any

import httpx

log = logging.getLogger("zdoda.voice.api")


class ZdodaApi:
    def __init__(self, base_url: str | None = None, secret: str | None = None) -> None:
        self.base = (base_url or os.environ.get("ZDODA_API_URL", "http://localhost:4000")).rstrip("/") + "/api/v1/voice-worker"
        self.secret = secret or os.environ.get("VOICE_WORKER_SECRET", "")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0))

    async def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        res = await self._client.post(self.base + path, json=body, headers={"x-voice-secret": self.secret})
        res.raise_for_status()
        return res.json()

    async def session(self, room: str, metadata: str, called: str | None, caller: str | None) -> dict[str, Any]:
        return await self._post("/session", {"room": room, "metadata": metadata or "", "calledNumber": called, "callerNumber": caller})

    async def retrieve(self, ws: str, call_id: str, query: str) -> str:
        try:
            out = await self._post("/retrieve", {"workspaceId": ws, "callId": call_id, "query": query[:1000]})
            return out.get("context") or ""
        except Exception as e:  # knowledge is best-effort; never break the call
            log.warning("retrieve failed: %s", e)
            return ""

    async def events(self, ws: str, call_id: str, items: list[dict[str, str]]) -> None:
        if not items:
            return
        try:
            await self._post("/events", {"workspaceId": ws, "callId": call_id, "items": items})
        except Exception as e:
            log.warning("events failed: %s", e)

    async def tool(self, ws: str, call_id: str, name: str, args: dict[str, Any]) -> dict[str, Any]:
        return await self._post("/tool", {"workspaceId": ws, "callId": call_id, "name": name, "args": args})

    async def end(self, ws: str, call_id: str, duration: float, reason: str) -> None:
        try:
            await self._post("/end", {"workspaceId": ws, "callId": call_id, "durationSec": round(duration, 1), "endedReason": reason[:80]})
        except Exception as e:
            log.warning("end failed: %s", e)

    async def aclose(self) -> None:
        await self._client.aclose()
