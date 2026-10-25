#pragma once
#include "esphome/core/component.h"
#include "esphome/components/microphone/microphone_source.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "mbedtls/gcm.h"
#include "lwip/sockets.h"
#include "esp_random.h"
#include <atomic>
#include <array>

namespace esphome::luna_audio {
// 20 ms, PCM16 mono, 16 kHz. Audio callback never does network I/O.
struct Frame { uint32_t generation; uint64_t offset; uint8_t audio[640]; };
class LunaAudio : public Component {
 public:
  void set_microphone(microphone::MicrophoneSource *mic) { mic_ = mic; }
  void set_host(const std::string &host) { host_ = host; }
  void set_port(uint16_t port) { port_ = port; }
  void set_stream_id(uint32_t id) { stream_id_ = id; }
  void set_key(const std::array<uint8_t, 32> &key) { key_ = key; }
  float get_setup_priority() const override { return setup_priority::AFTER_WIFI; }
  void setup() override;
  void loop() override;
  void on_shutdown() override;
  void set_enabled(bool enabled);
  uint32_t dropped() const { return dropped_.load(); }
  uint32_t sent() const { return sent_; }
  bool enabled() const { return enabled_.load(); }
 protected:
  void on_audio_(const std::vector<uint8_t> &data);
  microphone::MicrophoneSource *mic_{};
  QueueHandle_t queue_{};
  std::string host_;
  uint16_t port_{12101};
  uint32_t stream_id_{}, seq_{}, sent_{};
  std::array<uint8_t, 32> key_{};
  uint8_t boot_[8]{};
  mbedtls_gcm_context gcm_{};
  int socket_{-1};
  sockaddr_in destination_{};
  std::atomic<bool> enabled_{false};
  std::atomic<uint32_t> generation_{0}, dropped_{0};
  uint32_t callback_generation_{0};
  Frame partial_{};
  size_t filled_{0};
  uint64_t offset_{0};
};
} // namespace
