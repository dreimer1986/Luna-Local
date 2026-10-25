#include "luna_audio.h"
#include "esphome/core/log.h"
#include <cstring>
#include <fcntl.h>
#include <unistd.h>
namespace esphome::luna_audio {
static const char *const TAG = "luna_audio";
static void be(uint8_t *p, uint64_t x, size_t n) { for (size_t i=0;i<n;i++) p[n-1-i] = x >> (8*i); }
void LunaAudio::setup() {
  queue_ = xQueueCreate(32, sizeof(Frame));
  mbedtls_gcm_init(&gcm_);
  if (!queue_ || mbedtls_gcm_setkey(&gcm_, MBEDTLS_CIPHER_ID_AES, key_.data(), 256) != 0) {
    mark_failed(); return;
  }
  destination_.sin_family = AF_INET;
  destination_.sin_port = htons(port_);
  if (inet_pton(AF_INET, host_.c_str(), &destination_.sin_addr) != 1) { mark_failed(); return; }
  socket_ = ::socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
  if (socket_ < 0) { mark_failed(); return; }
  fcntl(socket_, F_SETFL, O_NONBLOCK);
  mic_->add_data_callback([this](const std::vector<uint8_t> &data) { on_audio_(data); });
}
void LunaAudio::set_enabled(bool enabled) {
  if (is_failed() || enabled == enabled_.load()) return;
  if (enabled) {
    // Random nonce prefix is renewed on every activation (and counter rollover).
    esp_fill_random(boot_, sizeof(boot_)); seq_ = 0;
    xQueueReset(queue_); generation_.fetch_add(1);
    enabled_.store(true); mic_->start();
  } else {
    enabled_.store(false); mic_->stop(); xQueueReset(queue_);
  }
  ESP_LOGI(TAG, "Continuous transport %s", enabled ? "enabled" : "disabled");
}
void LunaAudio::on_audio_(const std::vector<uint8_t> &data) {
  if (!enabled_.load()) return;
  auto gen = generation_.load();
  if (gen != callback_generation_) { filled_=0; offset_=0; callback_generation_=gen; }
  size_t pos=0;
  while (pos<data.size()) {
    size_t n=std::min(sizeof(partial_.audio)-filled_, data.size()-pos);
    memcpy(partial_.audio+filled_, data.data()+pos, n); filled_+=n;pos+=n;
    if (filled_==sizeof(partial_.audio)) {
      partial_.generation=gen;partial_.offset=offset_;offset_+=320;filled_=0;
      if (enabled_.load() && generation_.load()==gen && xQueueSend(queue_, &partial_, 0)!=pdTRUE) dropped_.fetch_add(1);
    }
  }
}
void LunaAudio::loop() {
  if (!enabled_.load() || is_failed()) return;
  Frame f;
  for (int count=0;count<8 && xQueueReceive(queue_, &f, 0)==pdTRUE;count++) {
    if (f.generation != generation_.load()) continue;
    uint8_t packet[28+640+16];
    memcpy(packet,"LUN2",4);be(packet+4,stream_id_,4);memcpy(packet+8,boot_,8);
    be(packet+16,seq_,4);be(packet+20,f.offset,8);
    int err=mbedtls_gcm_crypt_and_tag(&gcm_, MBEDTLS_GCM_ENCRYPT, 640, packet+8,12,
                                    packet,28, f.audio,packet+28,16,packet+668);
    if (err==0 && sendto(socket_,packet,sizeof(packet),0,reinterpret_cast<sockaddr *>(&destination_),sizeof(destination_))==sizeof(packet)) sent_++;
    else dropped_.fetch_add(1);
    if (++seq_==0) esp_fill_random(boot_,sizeof(boot_));
  }
}
void LunaAudio::on_shutdown() { set_enabled(false); if(socket_>=0) ::close(socket_); }
} // namespace
