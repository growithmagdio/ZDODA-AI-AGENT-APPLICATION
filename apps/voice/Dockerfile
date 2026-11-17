# Zdoda Voice Engine worker (LiveKit Agents). Runs on Cloud Run, Fly, Railway or any VM.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY zdoda_voice ./zdoda_voice
# Download VAD + turn-detector model weights into the image so calls start instantly.
RUN python -m zdoda_voice.agent download-files

# Health/metrics port used by LiveKit Agents in production mode.
EXPOSE 8081
CMD ["python", "-m", "zdoda_voice.agent", "start"]
