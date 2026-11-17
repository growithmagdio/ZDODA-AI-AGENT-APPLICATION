# Zdoda Voice Engine (worker)

Answers browser voice calls and phone calls for every Zdoda agent. Built on open-source **LiveKit Agents**:

`caller audio → Silero VAD → Deepgram STT → turn detector → LLM (Claude / GPT / Gemini) → ElevenLabs / Cartesia TTS → caller`

- Barge-in: the agent stops talking as soon as the caller speaks.
- Knowledge base: before each reply the worker asks the Zdoda API for matching passages.
- Tools: end call, transfer to a human (SIP REFER), plus every tool defined in the dashboard (Calendar, Sheets, GHL, API, MCP), executed by the API.
- Transcript, recording, summary, voice-minute usage and quotas are handled by the API (`/api/v1/voice-worker/*`).

## Run locally

```bash
cd apps/voice
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in LiveKit, Deepgram, a voice and an LLM key
python -m zdoda_voice.agent download-files
python -m zdoda_voice.agent dev
```

## Deploy (Google Cloud Run, same project as Firebase)

```bash
gcloud run deploy zdoda-voice --source apps/voice --region us-central1 \
  --min-instances 1 --no-cpu-throttling --cpu 2 --memory 4Gi --no-allow-unauthenticated \
  --set-env-vars ZDODA_API_URL=https://app.zdoda.com \
  --set-secrets LIVEKIT_URL=LIVEKIT_URL:latest,LIVEKIT_API_KEY=LIVEKIT_API_KEY:latest,LIVEKIT_API_SECRET=LIVEKIT_API_SECRET:latest,VOICE_WORKER_SECRET=VOICE_WORKER_SECRET:latest,DEEPGRAM_API_KEY=DEEPGRAM_API_KEY:latest,ELEVEN_API_KEY=ELEVENLABS_API_KEY:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest
```

The worker connects out to LiveKit, so it needs no public URL. One instance handles several calls at once; add instances as call volume grows.
