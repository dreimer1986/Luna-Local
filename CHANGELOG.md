# Changelog

## 0.4.0b2

- Register the avatar module automatically with the Home Assistant frontend using
  the installed integration version; no manual Lovelace resource is required.
- Declare the frontend dependency so registration happens after frontend setup.
- Explain how to diagnose missing card modules and install the current preview.

## 0.4.0b1

- Add an experimental browser voice/text client, shared card/popup presentation,
  local expression metadata and an original layered SVG preview rig.
- Estimate several mouth shapes from actual playback audio; final illustration
  rigging, phoneme alignment and live HA validation remain outstanding.
- Keep backgrounds and outfits separate, with all future outfits strictly SFW.
- Preserve the final short microphone buffer, handle delayed pipeline acknowledgements
  and stop continuous mode when TTS output is unavailable.
- Blend nine expression poses with head, eye, brow, blush and ear changes.
- Validate avatar WebSocket payloads with Home Assistant 2026.10's schema API.

- Add Luna-chan branding with local icon and light/dark logo variants, including high-resolution versions.
- Load the optional ESPHome package and audio component from a shared Git ref instead of requiring manual copies.
- Publish version-tagged releases after tests, Hassfest and HACS validation; enable local branding validation.

- Keep direct Ollama dialogue and memory requests resident instead of expiring after ten minutes.
- Preload the configured model in the background on integration startup, with bounded retries and without replacing an already loaded runner.
- Suggest Qwen3 4B Instruct for new installations; existing model selections remain unchanged.
- Expose separate load, prompt-evaluation and generation timings in room diagnostics.
- Close memory database connections deterministically, including failed transactions.

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
