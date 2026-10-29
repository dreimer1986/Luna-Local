# Changelog

## 0.4.0b8 — 2026-10-29

- Select an Assist pipeline directly in the avatar card; persist the choice per browser/dashboard. Switching cancels the old turn and starts a fresh conversation.
- Support Gemini and other explicitly selected conversation agents. Clean emoji before their selected TTS provider while retaining reply markers for gestures; no hidden Ollama expression request for external agents.
- Activate the private native donor model in the home installation: intact Chitose waving arm and Mao raised arm, native idle, mouth, blink and blush. Angry/hips/crossed shapes remain unavailable in this profile; no synthetic arm deformation is added.

## 0.4.0b7 — 2026-10-29

- Add bounded full-body poses: wave, hands on hips, crossed arms, and varied idle stances.
- Add coherent smile/angry/shy face deformation and soft cheek colour; correct hand mesh IDs.
- Map reply emoji to one-shot gestures for local and room responses without interrupting lip sync.
- Add `luna_local.avatar_pose` and `luna_local.avatar_reset` automation actions with duration,
  expression and intensity; commands expire, replace older commands and survive browser reconnect
  only for their remaining lifetime. They do not generate audio.
- Add a silent pose preview and transport/geometry/browser regression checks.


## 0.4.0b6 (development)

- Add persistent full/waist avatar framing, accessible on cards, popups and the
  fullscreen tablet view without restarting the speech session.

- Add optional display-only avatar card for a dedicated tablet dashboard, with
  tap-to-fullscreen and supported-browser screen wake lock.

- Discard microphone segments during Luna room TTS preparation/playback and a
  one-second acoustic tail, across configured rooms, while keeping transport on.
- Ignore empty STT results instead of asking for repetition. Allow only one
  clarification until a clear utterance; clarifications no longer renew context.
- Expose discarded playback-frame and empty-transcript counters for diagnosis.

## 0.4.0b5 (development)

- Follow continuous-listening replies from configured room voice assistants with
  silent audio analysis and playback-state-driven avatar lip sync. No duplicate
  browser audio; local browser conversations take priority.
- Strip emoji and common ASCII smileys before TTS, retaining original reply text
  and emotion markers as metadata for future avatar expression mapping.
- Cancel room animation on playback end, mute, listening disable or disconnect;
  support reconnects and joining an ongoing reply.
- Add backend, frontend and actual Luna rendering tests for room playback.

## 0.4.0b4 (development)

- Add optional Live2D card/popup rendering with actual playback-driven mouth controls,
  blinking, same-origin model loading, portrait fallback and cancellation handling.
- Add a private Luna portrait model workflow, mouth cleanup and coherent subtle
  breathing, head tilt and weight shift; honor reduced-motion preferences.
- Restrict native intent pre-recognition to exposed-entity matches so normal
  conversation reaches Luna instead of receiving unknown-device errors.
- Version frontend module imports to avoid stale session code after upgrades.
- Cubism Core, compiled runtime and template-derived authoring files remain private.

## 0.4.0b3

- Display the approved waist-up Luna illustration by default in cards and popups,
  preserving the original artwork exactly and shipping it with the integration.
- Keep the simplified SVG animation rig available only through `avatar: technical`.
  The illustration view currently has no facial animation or lip sync; conversation,
  microphone, playback and popup behavior are unchanged.

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
