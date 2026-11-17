"""Builds STT / TTS / LLM plugins from the agent's settings, with sensible fallbacks."""
from __future__ import annotations

import os
import re
from typing import Any

from livekit.plugins import anthropic, cartesia, deepgram, elevenlabs, google, openai

DEFAULT_LLM = {
    "anthropic": os.environ.get("ANTHROPIC_VOICE_MODEL", "claude-haiku-5-5"),
    "openai": os.environ.get("OPENAI_VOICE_MODEL", "gpt-4.1-mini"),
    "gemini": os.environ.get("GEMINI_VOICE_MODEL", "gemini-2.5-flash"),
}


def build_llm(model: dict[str, Any]):
    """Use the agent's provider when its key exists here; otherwise the first provider that has a key."""
    provider = model.get("provider") or "mock"
    temp = float(model.get("temperature", 0.3))
    has = {
        "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "openai": bool(os.environ.get("OPENAI_API_KEY")),
        "gemini": bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")),
    }
    if provider not in has or not has[provider]:
        provider = next((p for p in ("anthropic", "openai", "gemini") if has[p]), None)
        model_id = DEFAULT_LLM.get(provider or "", "")
    else:
        model_id = model.get("id") or DEFAULT_LLM[provider]
    if provider == "anthropic":
        return anthropic.LLM(model=model_id, temperature=temp)
    if provider == "openai":
        return openai.LLM(model=model_id, temperature=temp) if not re.match(r"^(gpt-5|o\d)", model_id) else openai.LLM(model=model_id)
    if provider == "gemini":
        return google.LLM(model=model_id, temperature=temp, api_key=os.environ.get("GEMINI_API_KEY") or None)
    raise RuntimeError("No LLM API key configured for the voice worker (ANTHROPIC_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY)")


def build_stt(voice: dict[str, Any]):
    lang = voice.get("sttLanguage") or "multi"
    keywords = [k for k in voice.get("keywords") or [] if k]
    kwargs: dict[str, Any] = {"model": "nova-3", "language": lang}
    if keywords:
        kwargs["keyterm"] = keywords
    try:
        return deepgram.STT(**kwargs)
    except TypeError:  # older plugin without keyterm
        kwargs.pop("keyterm", None)
        return deepgram.STT(**kwargs)


def build_tts(voice: dict[str, Any], language: str | None):
    provider = voice.get("ttsProvider") or "elevenlabs"
    voice_id = voice.get("voiceId") or ""
    available = {
        "elevenlabs": bool(os.environ.get("ELEVEN_API_KEY") or os.environ.get("ELEVENLABS_API_KEY")),
        "cartesia": bool(os.environ.get("CARTESIA_API_KEY")),
        "openai": bool(os.environ.get("OPENAI_API_KEY")),
    }
    if not available.get(provider):
        provider = next((p for p in ("elevenlabs", "cartesia", "openai") if available[p]), "")
        voice_id = ""
    if provider == "elevenlabs":
        kw: dict[str, Any] = {"model": "eleven_flash_v2_5", "api_key": os.environ.get("ELEVEN_API_KEY") or os.environ.get("ELEVENLABS_API_KEY")}
        if voice_id:
            kw["voice_id"] = voice_id
        return elevenlabs.TTS(**kw)
    if provider == "cartesia":
        return cartesia.TTS(model="sonic-3", voice=voice_id or None, language=(language or "en")[:2].lower()) if voice_id else cartesia.TTS(model="sonic-3")
    if provider == "openai":
        return openai.TTS(model="gpt-4o-mini-tts", voice=voice_id or "alloy")
    raise RuntimeError("No TTS API key configured (ELEVEN_API_KEY, CARTESIA_API_KEY or OPENAI_API_KEY)")


_NUM_WORDS = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine"}


def speakable(text: str) -> str:
    """Light text normaliser for TTS: phone numbers digit by digit, symbols to words."""
    text = re.sub(r"https?://\S+", "the link we'll send you", text)
    text = re.sub(r"\+?\d[\d\s().-]{8,}\d", lambda m: " ".join(_NUM_WORDS.get(c, "") for c in m.group(0) if c.isdigit()), text)
    text = text.replace("&", " and ").replace("%", " percent")
    return re.sub(r"[*_#`]", "", text)
