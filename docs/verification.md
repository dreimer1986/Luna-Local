# Verification and limits

Development baseline: Home Assistant 2026.10.4, ESPHome 2026.10.0, two Home Assistant Voice devices, 25 October 2026.

- Original continuous transport tests delivered 2543/2543 and 1770/1770 encrypted synthetic packets with no measured sample loss, including packets arriving during simulated playback. These were software tests, not acoustic full-duplex validation.
- Version 0.2.1 passed eight HA speech-adapter tests and ten transport/memory unit tests, plus cancellation/deletion checks. A synthetic HA Cloud/Amala TTS → STT round trip succeeded without physical playback. Google Callirrhoe reached its provider but that installation's account returned HTTP 402 for depleted credits; voice availability is account-dependent.
- Version 0.2.2 adds real Silero checks on synthetic silence/noise and deterministic tests of no-name room questions, clarification cooldown and no-memory handling of unclear speech.
- Physical rain recordings, quiet/short speech, overlapping speakers, echo during real playback and two simultaneous rooms still need installation-specific evaluation. There is no speaker recognition, camera recognition or guarantee of human-level understanding.
- Hosted HACS/Hassfest workflows must run after publication. Adding the repo as custom is separate from approval for the default catalog.

Final 0.2.2 checks: 16 unit tests, eight HA adapter tests and cancellation checks passed. Silero accepted synthetic Amala speech, followed by a successful STT round trip. Three live Ollama cases passed: unintelligible/no-context silence, addressed clarification and an open room question without a name. Physical microphone/rain testing remains pending.
