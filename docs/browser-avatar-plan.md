# Luna in the browser: implementation design

Status: the browser client uses the approved static illustration by default (b3).
Live2D Cubism is the chosen animation system; the PNG deformation experiment will
not become the production renderer. See [Live2D preparation and open prerequisites](live2d/README.md)
and [setup and limitations](browser-avatar.md). A layered Luna source, compiled rig,
SDK integration and visual acceptance remain outstanding. Frigate and robot support
are design only.

## Agreed scope

- Browser first, using its microphone and speakers.
- Lovelace card and popup are equal presentations of one component.
- Preserve the approved Luna-chan identity.
- Frame Luna to the hips; a full-body presentation has lower priority.
- Keep backgrounds and outfits independent of the dialogue and animation code.
  Future outfit changes must always be Safe for Work, age-appropriate and fully
  non-sexualized. The initial outfit is the approved cream knitted sweater.
- Speech-linked mouth shapes, expressive eyes/brows, blush, head/ear movement.
- Prepare independent adapters for future Frigate observations and a robot.

## One session, two presentations

Use one `LunaBrowserSession` per browser conversation. It owns the Assist run,
microphone stream, playback clock, conversation ID, avatar events and cancellation.
The card and popup both render that session. Moving between them must not start a
second recording, replay an answer or create a second agent conversation.

The shared view exposes listen/stop, interrupt speech, mute, text input, transcript,
pipeline selection and a clearly visible recording state. A popup is a presentation
option of the same frontend module, not a second voice implementation or a required
Browser Mod dependency. Closing the last visible view stops recording and playback.
Returning to a background tab must not silently re-enable a stopped microphone.

Use the configured Home Assistant Assist pipeline (Luna as conversation agent),
including the selected STT/TTS language and voice. Do not substitute browser speech
recognition or another TTS service. Browser capture uses a secure origin and explicit
microphone permission; audio is enabled from the user's start gesture.

For HACS delivery, ship frontend code and assets inside the integration folder and
serve a versioned static resource from the integration. This avoids asking HACS to
install a second repository type from the same repository. Document the resource
registration and its update/cache behavior.

## Voice and synchronization

1. Capture mono PCM in an AudioWorklet and stream it through `assist_pipeline/run`.
2. Follow STT/intent/TTS events for listening, thinking and error states.
3. Obtain the exact TTS audio returned by the chosen pipeline.
4. Produce timestamped **visemes** (visible mouth shapes) for that audio.
5. Animate against the audio player's actual playback position, not request time,
   estimated text duration or the `tts-end` event. `tts-end` means audio generation,
   not that the browser has finished speaking.

Prefer TTS-provider phoneme timings when actually available; HA's generic pipeline
API does not promise them. A provider-independent local alternative is Rhubarb Lip
Sync, using its `phonetic` recognizer for German and exporting JSON mouth cues.
It operates on audio files and adds preprocessing latency. Conversion to supported
WAV/OGG and analysis belong in a separate local worker/app or service, not a shell
binary silently downloaded into Home Assistant Core. Benchmark German speech and
target hardware before deciding buffering and sentence chunk sizes.

Live2D's browser MotionSync plugin is an alternative real-time analysis path, but
must be evaluated with the chosen rig and German TTS; its runtime distribution and
license terms are separate from an open-source wrapper. Do not commit proprietary
runtime binaries merely because their wrapper is available on GitHub.

Amplitude-only mouth opening is not the intended final lip sync. Audio-driven
viseme inference is approximate; describe its quality honestly. If alignment is
unavailable, expose that status rather than presenting random mouth shapes as
phoneme-accurate. Pause, seek, buffering, interruption and audio errors must pause
or reset mouth motion immediately. All cues carry the turn/session ID so stale
analysis cannot animate a newer answer.

## Character and emotions

Recommended visual direction: a rigged 2D bust preserving the approved illustration.
The flat branding PNG is the character reference, not a finished Live2D model.
Eyes, lids, brows, mouth shapes, face, hair, ears and upper body need separate layers
and an animation rig. A polished rig is an art/rigging deliverable; neither the PNG
nor a CSS scale animation supplies it automatically. Live2D is a suitable candidate,
with a layered Canvas renderer as an alternative if its quality proves sufficient.
Keep the renderer replaceable so a later 3D avatar does not replace dialogue logic.

Target expression vocabulary: neutral, joyful, amused, laughing, angry,
shy/embarrassed, curious, thoughtful, surprised, concerned and sad. The current
backend does not yet emit laughing or angry. Distinguish listening/thinking/speaking
states from emotional expression. Blend expression intensity over time; combine
blush, brow/eye shape, gaze and head/ear posture. Do not switch the whole face
abruptly on every word or randomly choose emotions from keywords.

Emotion describes Luna's intended delivery, not an assertion about the user's
private feelings. Generate it from the current conversation and response as bounded
structured metadata. `continuous.py` already requests structured JSON from Ollama;
extend that schema compatibly. Normal `conversation.py` delegates to an HA Ollama
agent and needs a separate metadata path or a shared response envelope. Do not leak
JSON markers into spoken text or break the existing Assist/memory/control behavior.
Invalid metadata falls back to neutral. Native control replies get deterministic,
restrained expressions. Segment-level cues can change expression during an answer.

Example normalized event (proposed, not an existing API):

```json
{
  "version": 1,
  "session_id": "browser-session",
  "turn_id": "turn-42",
  "kind": "performance",
  "expression": {"name": "joyful", "intensity": 0.55},
  "gaze": {"target": "conversation"},
  "gesture": "small_nod",
  "mouth_cues": [{"start": 0.10, "end": 0.19, "shape": "A"}]
}
```

Use authenticated, session-scoped transport. A second browser/room must not receive
another session's transcripts or accidentally synchronize to its speech. Do not
store full conversations in HA sensor attributes or broadcast them globally.

## Frigate later

Add a separate observation adapter for Frigate MQTT events and optional snapshots.
Normalize events with camera, zone, tracked-object ID, label, confidence, timestamps,
source and expiry. Deduplicate update bursts for the same object and retain the
distinction between a detection, an identity hint and a confirmed fact.

Frigate observations can influence attention or provide explicitly attributed
conversation context; a camera detection must not automatically become a permanent
memory or a robot command. A detection of a person does not identify who spoke.
Do not fetch every camera frame or enable a continuous vision-model loop by default.
Camera-coordinate gaze needs a calibration/mapping step; image coordinates are not
physical world coordinates or navigation targets.

## Robot later

Reuse the dialogue/performance protocol, not the browser rendering implementation.
Map high-level expressive intents such as `small_nod` to the platform's own motion
controller. Physical navigation remains a separate capability with bounded motion,
obstacle handling, cancellation and a local emergency stop; emotion metadata must
never contain raw motor/servo commands. Hardware choice and localization determine
that adapter and are not prerequisites for the browser avatar.

## Implementation milestones and acceptance

1. **Browser conversation:** card and popup share one session; real microphone →
   configured Assist → browser audio; text input and interruption work. Test HTTPS,
   rejected permissions, disconnects, repeated open/close, audio errors and two tabs.
2. **Luna rig:** approve a moving sample showing blink, gaze, head tilt, blush and
   several mouth shapes before integrating conversational emotion. Preserve identity
   at both small card and large popup sizes.
3. **Expression and lip sync:** use the same playback audio for alignment, test
   German consonants/vowels, silence, laughter, interruption and rapid turns. Measure
   analysis latency on the actual host; do not promise a latency before benchmarking.
4. **Frigate and robot adapters:** add only when configured and when their hardware
   and desired behaviors are known.

The browser milestone alone is not the finished expressive avatar. Completion of
the requested visual behavior requires milestones 2 and 3 as well.

## Primary references

- [Home Assistant Assist pipeline WebSocket API](https://contributors.home-assistant.io/core/internals/assist-pipelines/)
- [Home Assistant frontend pipeline implementation](https://github.com/home-assistant/frontend/blob/dev/src/data/assist_pipeline.ts)
- [Rhubarb Lip Sync: recognizers and mouth-cue JSON](https://github.com/DanielSWolf/rhubarb-lip-sync)
- [Live2D MotionSync for Web](https://docs.live2d.com/en/cubism-sdk-manual/cubism-sdk-motionsync-plugin-for-web/)
- [Microphone secure-context requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web Audio startup behavior](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Frigate MQTT events](https://docs.frigate.video/integrations/mqtt/)
