# Changelog

## 0.3.0

- Add idle-branch Voice ring feedback for continuous listening, processing and announcement playback.
- Add persistent per-room home/media control mode: off, direct Luna address (default), or no name required.
- Route permitted commands through native HA intents, including Music Assistant, preserving exposure checks.
- Drop stale work after permission changes and suppress duplicate commands heard in multiple rooms.

## 0.2.2

- Package integration, ESPHome overlay and generic setup examples for HACS custom-repository use.
- Add local Silero speech verification before STT, without pausing capture.
- Classify unclear/noise turns, suppress automatic memory for them and rate-limit contextual clarification to 30 seconds per room.

## 0.2.1

- Follow the first selected Assist pipeline for STT, TTS, language and voice at each operation.
- Report selected/last-used providers and explicit errors without silent provider fallback.

## 0.2.0

- Independent encrypted continuous PCM stream, bounded processing queues and persistent local memory.
