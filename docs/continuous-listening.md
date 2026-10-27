# Continuous listening setup

This is an advanced, optional setup. Start with normal Assist and confirm Ollama, STT and TTS work before adding the audio stream. Back up your existing Voice YAML and firmware configuration.

## Hardware and firmware

The supplied overlay was exercised with Home Assistant Voice and ESPHome 2026.10.0. It expects an existing configuration exposing these IDs:

- `i2s_mics`: microphone source capable of 16 kHz, 16-bit mono.
- `master_mute_switch`: hardware mute state.
- `init_in_progress`: initialization flag.

Other devices/base packages may require adaptation. The overlay is **not a complete flashable YAML**. Preserve your existing Wi-Fi, encryption, OTA, microphone/speaker and Assist configuration. Do not replace your whole device config with the example.

1. Merge `examples/voice-overlay.yaml` into the existing device YAML in `/config/esphome/`. Its remote package loads `esphome/packages/luna-ambient.yaml` from this repository; that package fetches `luna_audio` from `esphome/components`.
2. Choose `luna_source_ref`: `master` follows development; a published tag such as `v0.3.1` fixes the version. Both package and component use this value, so keep it in the main device YAML. Use a tag only after it exists on GitHub.
3. No component/package copies are needed for this Git-based setup. ESPHome needs access to GitHub when fetching sources. The new overlay becomes available remotely only after these repository changes are published.
4. Set `luna_receiver_host` to Home Assistant's LAN IPv4 address. Set a unique numeric `luna_stream_id` per device.
5. Set `luna_status_entity` to this room's Luna audio sensor entity ID (after adding the receiver/integration). The firmware reads its `aktivitaet` attribute for LED feedback. The overlay also expects the standard Voice LED scripts, `voice_assistant_leds`, `led_ring` and `external_media_player` IDs.
6. Generate a **different key for each device** with `python3 -c 'import secrets; print(secrets.token_hex(32))'`. Add it to ESPHome `secrets.yaml`, e.g. `luna_audio_key: "<64 hex characters>"`. Multiple devices need different secret names in their substitutions.
7. Validate and compile in ESPHome Device Builder. Confirm the required IDs and microphone format match your base configuration before flashing. Preserve your original firmware for rollback.
8. After flashing, check that normal Assist and physical mute still work. Leave the new listening switch off until the receiver is configured.

The switch is named `Luna dauerhaft mithoeren`. Its restore mode is `RESTORE_DEFAULT_OFF`: first boot defaults off, but a saved on-state can be restored after reboot. Hardware mute also gates transmission. Turning listening off clears receiver queues and prevents in-flight model results from becoming late spoken replies.

## Updating the ESPHome sources

ESPHome checks the package and external-component caches when processing the
device configuration, with a `1d` refresh interval. This does not update running
firmware automatically. Validate, build and install the firmware after fetching
changes. To force a branch refresh immediately, temporarily use `refresh: 0s`
on both Git sources (or clean the corresponding ESPHome Git caches).

For reproducible builds, set `luna_source_ref` in the device YAML to a published
tag such as `v0.3.1`; change it deliberately when upgrading. The same value selects
both the package and the component. A branch can change between fetches, so use a
fixed tag or commit when matching versions matters. Your Wi-Fi, secrets, receiver
address and stream ID remain in your local device configuration.

To migrate from the old copied setup, replace the local
`luna: !include packages/luna-ambient.yaml` entry with the remote `packages.luna`
mapping from the example and add `luna_source_ref` to your substitutions. Remove
any separate local `external_components` entry for `luna_audio` to avoid loading
two copies. Existing copied files can remain unused until you confirm the new
firmware works.

For offline/manual builds, keep the original local include, copy the package and
component from the same repository revision, and replace the package's Git source
with `type: local` / `path: components` (remove its Git-only `url`, `ref`, and
`refresh` fields). That path is relative to the main device YAML.

## Home Assistant receiver

Copy `examples/luna_audio.example.json` to `/config/luna_audio.json` and replace **every placeholder**:

| Field | Meaning |
| --- | --- |
| `name` | Display label for this room |
| `stream_id` | Same unique integer as the firmware |
| `key` | Same 64-character hexadecimal key as the firmware |
| `host` | Voice device's LAN IPv4 address; source-IP check uses this |
| `device_id` | HA device registry ID, visible in its device-page URL; not the MAC address |
| `switch` | Entity ID of this device's Luna listening switch |
| `mute` | Entity ID of its mute switch |
| `satellite` | Entity ID of its Assist satellite |
| `media_player` | Entity ID of its speaker media player |

Add one object per device to `rooms`. Use DHCP reservations for stable addresses. Keep this file private, for example mode `600`; it contains decryption keys. Do not commit it or ESPHome secrets to Git.

Reload Luna or restart Home Assistant. The receiver binds UDP **12101** on Home Assistant's host/network namespace. Allow LAN devices to reach it; Container installations need UDP port forwarding or host networking. Do not expose this port to the internet. The device is identified by both source IP and authenticated stream ID.

Select the desired primary Assist pipeline on each Voice. Enable `Luna dauerhaft mithoeren` when the people present expect continuous listening. Disable it or use physical mute to stop it. Inspect the Luna audio diagnostic sensor attributes: packets should increase while enabled, and selected STT/TTS/voice should match your first assistant. The ESPHome counters show sent/dropped packets.

## Troubleshooting

- **No packets:** check device IP, receiver IP, UDP mapping, switch and physical mute.
- **Rejected packets:** check matching stream ID/key. Each device needs its own key and ID.
- **No speech:** check selected pipeline, provider errors, noise rejection counters and microphone format/channel. Silero needs at least 160 ms probable speech including a 96 ms consecutive run; very short/quiet utterances may be missed.
- **Wrong voice:** inspect the first assistant, its TTS language/voice and sensor attributes. The secondary slot is not the continuous-mode selector.
- **Slow response:** inspect queue depth and model latency. Use a model your local hardware can serve promptly; finite queues cannot compensate for permanent overload.
- **Echo or rain comments:** acoustic conditions still matter. Silero plus model classification reduce false responses but cannot guarantee perfect discrimination.
- **Cloud error:** provider/account failures are shown rather than silently falling back to local speech.

To remove continuous mode, disable listening, remove the overlay and restore/rebuild the prior firmware, then remove `/config/luna_audio.json` and reload Luna. Keep the memory database if you want to retain memories. Basic Assist memory use remains available without the audio receiver.
