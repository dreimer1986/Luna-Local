# Luna Local

Experimental Home Assistant conversation agent with persistent local memory and optional continuous room listening. German dialogue is currently the primary supported language. Ollama runs the conversation locally; speech recognition and voice output follow the selected Assist pipeline, so Whisper/Piper can keep speech local or you can explicitly choose cloud providers.

**Version 0.3.0.** Tested with Home Assistant 2026.10.4, ESPHome 2026.10.0 and Home Assistant Voice hardware. This is not a robot, camera integration or speaker-identification system.

## Install with HACS

1. In HACS, add `https://github.com/dreimer1986/Luna-Local` as a **custom repository**, type **Integration**.
2. Download Luna Local and restart Home Assistant.
3. Install/configure Home Assistant's Ollama integration and pull a suitable model on your Ollama server. The server must be reachable **from Home Assistant**, not just from your browser. `127.0.0.1` only works when Ollama shares that network namespace.
4. Add **Luna Lokal** in Settings → Devices & services. Enter the existing Ollama conversation entity, reachable Ollama URL and installed model name. Reconfigure these values from the integration menu later.
5. Create an Assist pipeline using the Luna conversation agent and your chosen STT/TTS providers and language/voice. Select it as the Voice device's first assistant.

For manual installation, copy `custom_components/luna_local` into your Home Assistant configuration directory and follow steps 2–5. HACS installs the integration only; it does not install Ollama models, STT/TTS providers or flash Voice hardware.

This repository is prepared for HACS custom-repository installation. It is not included in the default HACS catalog. Catalog submission, branding and hosted validation are separate steps. See [HACS integration requirements](https://www.hacs.xyz/docs/publish/integration/).

## Continuous listening (optional)

Normal Assist use works without custom firmware. Continuous listening additionally requires the ESPHome component and room mapping described in [the setup guide](docs/continuous-listening.md).

When enabled, an independent microphone consumer sends authenticated, encrypted PCM over the LAN to Home Assistant. Capture continues while STT, Ollama and TTS run. There is no wake-word or mandatory-name gate. Luna can respond to open room questions and relevant conversation; the model decides whether a contribution is appropriate. Existing explicit Assist pipelines can remain configured, including a second cloud assistant.

Finite queues can overflow when processing cannot keep up. Diagnostic sensor attributes expose packet loss, queued work, provider selection and errors. Acoustic full-duplex behaviour, echo and Wi-Fi reliability still need testing in each installation. Text-based echo suppression is not a substitute for acoustic echo cancellation.

## Noise and clarification filter

WebRTC VAD first segments the stream. A second **local Silero VAD** check rejects segments without sufficient probable speech before sending audio to STT. It runs outside Home Assistant's event loop and never pauses microphone capture. The packaged model needs no runtime cloud service.

The room model then classifies speech as clear, unclear or noise. Noise gets no response. Unclear speech is not automatically saved as a memory; a short clarification is allowed when direct address, an ongoing Luna conversation or a recognisable room question suggests a response is expected. Clarifications are limited to once per room per 30 seconds. Clear questions do not require saying “Luna”.

These are probabilistic filters, not a guarantee that every rain sound is rejected. A completely unintelligible utterance cannot reliably reveal its intended recipient. Provider errors remain diagnostic errors; they are not treated as ordinary background noise. HA's common STT interface does not provide a universal word-confidence score.

## Speech settings

STT, TTS, language and voice are read from the device's **first selected assistant** for each operation. Changes take effect without a Luna restart. The second assistant slot is not used for continuous speech settings. Selecting the device's preferred/default option follows Home Assistant's preferred pipeline.

The continuous conversation model remains the Ollama model configured in Luna. Changing speech settings does not replace that model with the pipeline's conversation agent. Unsupported or unavailable providers produce an error rather than silently switching to a different provider. Cloud providers send audio/text to their service and may require an account or credits.

## Status ring and home / music control

The Voice overlay adds a quiet cyan ring while continuous listening is enabled, the standard Thinking animation during processing and the standard Replying animation during actual announcement playback. Existing explicit Assist/Gemini, SIP, timers, physical controls, mute and startup indicators retain priority. This requires the 0.3.0 firmware overlay and the `luna_status_entity` substitution pointing to the room's Luna audio sensor. Firmware and integration must both be updated.

Each Voice gets a **Luna Haussteuerung** select with three modes:

- **Aus**: Luna does not execute native home/media commands.
- **Nur mit Luna** (default): continuous-mode commands must start with “Luna” or “Hey Luna”. Ordinary room conversation still needs no name. An explicitly activated normal Assist turn already counts as addressed.
- **Ohne Namensansprache**: recognised native commands may execute without a name.

The mode is saved across restarts. Startup blocks commands until the saved mode is restored; changing modes invalidates queued work. The separate Gemini agent keeps its own permissions. These controls do not disable memory commands. There is no speaker authentication: television audio saying “Luna, …” can still satisfy the name requirement.

Luna uses Home Assistant's native intent engine and exposed entities, not model-generated service calls. For example: “Luna, Licht Wohnzimmer an” or “Luna, spiele das Album Rumours auf Verstärker”. Music Assistant players must be exposed to Assist and have suitable names/area assignments. Search/play, pause/resume and volume support follow the installed HA sentences. Unsupported phrases cannot be executed merely because the language model understands them. See [Music Assistant voice control](https://www.music-assistant.io/integration/voice/).

## Persistent memory

Facts are stored in `/config/luna_local_memory.sqlite3` and survive restarts. Automatic selection uses recognised personal statements and the local model; errors are possible. Stored text retains its source and original wording. Unknown speakers are not identified or assigned to the Home Assistant user.

- Say “Merke dir: Ich trinke Kaffee ohne Zucker.” to save explicitly.
- Say “Vergiss Erinnerung <ID>” to delete a specific entry.
- Use `luna_local.recall` with optional `query` and `limit` to list entries and IDs.
- Use `luna_local.remember` with `text` and optional `source`, or `luna_local.forget` with `memory_id`.

There is a 5,000-fact limit. Retrieval uses keywords and recency, not semantic embeddings. Audio is buffered in RAM, not continuously recorded to disk. Short-term dialogue and queued audio do not survive restart. Deletion removes active entries; existing backups and other HA/provider logs are not erased. If continuous listening is active, it can also hear conversations conducted through another assistant.

## Development and verification

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-test.txt
python -m unittest discover -s tests -v
```

The unit suite covers transport authentication/replay rejection, segmentation, memory persistence/deletion, synthetic noise rejection and clarification rules. `tests/speech_adapter_ha.py`, `tests/control_ha.py` and `tests/continuous_cancellation.py` additionally run in a Home Assistant Python environment with the repository on `PYTHONPATH`; they do not activate microphones or speakers. Integration imports require the manifest requirements to be installed.

GitHub Actions are configured for unit tests, Hassfest and HACS validation. The custom-repository workflow skips the external brands check; this is not a claim of default-catalog approval. See [verification notes](docs/verification.md) for tested behaviour and remaining hardware checks.

## License and dependencies

BSD-2-Clause, see [LICENSE](LICENSE). Dependencies retain their own licenses, including [pySilero VAD](https://github.com/rhasspy/pysilero-vad), [Silero VAD](https://github.com/snakers4/silero-vad), WebRTC VAD and ESPHome. No upstream Voice firmware is redistributed here; the ESPHome files are an overlay for an existing compatible configuration.
