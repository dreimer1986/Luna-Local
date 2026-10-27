# Verification and limits

Browser-avatar preview 0.4.0b1: eleven Node tests cover PCM framing, registered
Luna pipeline selection, cancellation and late events/permissions, queued EOF,
playback lifecycle, hidden tabs, final microphone buffers, acknowledgement timeout,
missing TTS and spectral mouth estimates. Six Python avatar tests check payload
validation, bounded metadata, timeout/busy fallback and static asset registration.
Headless Edge passed
module loading, SVG rendering and popup open/close with the same session; the
screenshot was inspected. All 30 Python tests pass (including 24 existing tests). Python syntax
and JS syntax were checked. No live HA/STT/TTS/browser-microphone end-to-end test
has been performed for this new client. The SVG is a simplified preview, not the
final rigged illustration; speech analysis is approximate, not phoneme alignment.

Version 0.3.1 packaging: 24 existing unit tests pass locally. The release workflow's
version check accepts the matching manifest/tag, rejects a mismatch and extracts
the correct changelog section. ESPHome YAML syntax, shared Git-ref configuration
and referenced repository paths were checked; remote fetching and a full device
compile of the new overlay remain pending publication. Brand PNG dimensions and
small-size appearance were inspected. No firmware was flashed and no Home Assistant
configuration was changed for this packaging update.

Development baseline: Home Assistant 2026.10.4, ESPHome 2026.10.0, two Home Assistant Voice devices, 25 October 2026.

- Original continuous transport tests delivered 2543/2543 and 1770/1770 encrypted synthetic packets with no measured sample loss, including packets arriving during simulated playback. These were software tests, not acoustic full-duplex validation.
- Version 0.2.1 passed eight HA speech-adapter tests and ten transport/memory unit tests, plus cancellation/deletion checks. A synthetic HA Cloud/Amala TTS → STT round trip succeeded without physical playback. Google Callirrhoe reached its provider but that installation's account returned HTTP 402 for depleted credits; voice availability is account-dependent.
- Version 0.2.2 adds real Silero checks on synthetic silence/noise and deterministic tests of no-name room questions, clarification cooldown and no-memory handling of unclear speech.
- Physical rain recordings, quiet/short speech, overlapping speakers, echo during real playback and two simultaneous rooms still need installation-specific evaluation. There is no speaker recognition, camera recognition or guarantee of human-level understanding.
- Hosted HACS/Hassfest workflows must run after publication. Adding the repo as custom is separate from approval for the default catalog.

Final 0.2.2 checks: 16 unit tests, eight HA adapter tests and cancellation checks passed. Silero accepted synthetic Amala speech, followed by a successful STT round trip. Three live Ollama cases passed: unintelligible/no-context silence, addressed clarification and an open room question without a name. Physical microphone/rain testing remains pending.

Version 0.3.0: 16 core tests, eight speech-adapter tests, five control/status tests and cancellation checks passed. Native HA debug recognition resolved German light-on, named-player pause and album search/play requests to the intended exposed entities without executing them. Both Voice firmware builds compiled and uploaded successfully. Real ring appearance and acoustic end-to-end command execution still need user observation; no light or music state was changed by these tests.
