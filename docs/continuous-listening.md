# Continuous listening setup

This is an advanced, optional setup. Start with normal Assist and confirm Ollama, STT and TTS work before adding the audio stream. Back up your existing Voice YAML and firmware configuration.

## Hardware and firmware

The supplied overlay was exercised with Home Assistant Voice and ESPHome 2026.10.0. It expects an existing configuration exposing these IDs:

- `i2s_mics`: microphone source capable of 16 kHz, 16-bit mono.
- `master_mute_switch`: hardware mute state.
- `init_in_progress`: initialization flag.

Other devices/base packages may require adaptation. The overlay is **not a complete flashable YAML**. Preserve your existing Wi-Fi, encryption, OTA, microphone/speaker and Assist configuration. Do not replace your whole device config with the example.

1. Copy `esphome/components/luna_audio` into `/config/esphome/components/luna_audio`.
2. Copy `esphome/packages/luna-ambient.yaml` into `/config/esphome/packages/`.
3. Merge `examples/voice-overlay.yaml` into the existing device YAML in `/config/esphome/`. The local external-component path `components` is relative to the main YAML. Adjust it if your layout differs.
4. Set `luna_receiver_host` to Home Assistant's LAN IPv4 address. Set a unique numeric `luna_stream_id` per device.
5. Generate a **different key for each device** with `python3 -c 'import secrets; print(secrets.token_hex(32))'`. Add it to ESPHome `secrets.yaml`, e.g. `luna_audio_key: "<64 hex characters>"`. Multiple devices need different secret names in their substitutions.
6. Validate and compile in ESPHome Device Builder. Confirm the required IDs and microphone format match your base configuration before flashing. Preserve your original firmware for rollback.
7. After flashing, check that normal Assist and physical mute still work. Leave the new listening switch off until the receiver is configured.

The switch is named `Luna dauerhaft mithoeren`. Its restore mode is `RESTORE_DEFAULT_OFF`: first boot defaults off, but a saved on-state can be restored after reboot. Hardware mute also gates transmission. Turning listening off clears receiver queues and prevents in-flight model results from becoming late spoken replies.

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
