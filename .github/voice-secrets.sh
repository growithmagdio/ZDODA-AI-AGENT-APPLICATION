#!/usr/bin/env bash
# Prints the --set-secrets mapping for the voice worker from the names collected in .voice-secrets.
# ElevenLabs' plugin reads ELEVEN_API_KEY.
set -e
out=""
while read -r s; do
  [ -z "$s" ] && continue
  name="$s"; [ "$s" = "ELEVENLABS_API_KEY" ] && name="ELEVEN_API_KEY"
  out="$out${out:+,}${name}=${s}:latest"
done < .voice-secrets
printf '%s' "$out"
