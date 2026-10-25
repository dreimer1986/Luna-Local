"""Authenticated audio transport and nonblocking, continuous speech segmentation.

No network I/O, STT, model calls or playback in the ingest path. PCM is only
kept in bounded RAM queues. The transport never stops for an assistant reply.
"""
from collections import deque
from dataclasses import dataclass
import struct
import time
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

HEADER = struct.Struct('!4sI8sIQ')
FRAME_BYTES = 640
FRAME_SAMPLES = 320


class Decoder:
    def __init__(self, stream_id, key):
        self.stream_id = stream_id
        self.aes = AESGCM(bytes.fromhex(key))
        self.boot = None
        self.seen_boots = deque(maxlen=128)
        self.sequence = -1
        self.offset = None
        self.received = self.lost_samples = self.rejected = 0
        self.last_packet = 0.0

    def decode(self, packet):
        if len(packet) != HEADER.size + FRAME_BYTES + 16:
            self.rejected += 1
            return None
        magic, stream, boot, sequence, offset = HEADER.unpack_from(packet)
        if magic != b'LUN2' or stream != self.stream_id or offset % FRAME_SAMPLES:
            self.rejected += 1
            return None
        try:
            pcm = self.aes.decrypt(packet[8:20], packet[28:], packet[:28])
        except Exception:
            self.rejected += 1
            return None
        fresh = boot != self.boot
        if fresh:
            if boot in self.seen_boots:
                self.rejected += 1
                return None
            if self.boot is not None:
                self.seen_boots.append(self.boot)
            self.boot, self.sequence, self.offset = boot, -1, None
        if sequence <= self.sequence or (self.offset is not None and offset < self.offset):
            self.rejected += 1
            return None
        gap = 0 if self.offset is None else max(0, offset - self.offset)
        self.lost_samples += gap
        self.sequence = sequence
        self.offset = offset + FRAME_SAMPLES
        self.received += 1
        self.last_packet = time.monotonic()
        return pcm, fresh, gap


@dataclass
class Segment:
    audio: bytes
    ended: float
    duration: float


class Segmenter:
    """20 ms frames; 300 ms pre-roll, 700 ms trailing silence; 12 s maximum.

The VAD splits the *continuing* audio stream, not microphone recording.
"""
    def __init__(self, vad, emit):
        self.vad, self.emit = vad, emit
        self.reset()

    def reset(self):
        self.pre = deque(maxlen=15)
        self.votes = deque(maxlen=5)
        self.frames = []
        self.voiced = self.quiet = 0

    def feed(self, pcm):
        speech = self.vad.is_speech(pcm, 16000)
        if not self.frames:
            self.pre.append(pcm)
            self.votes.append(speech)
            if sum(self.votes) >= 3:
                self.frames = list(self.pre)
                self.pre.clear()
                self.voiced = sum(self.votes)
                self.quiet = 0
            return
        self.frames.append(pcm)
        self.voiced += speech
        self.quiet = 0 if speech else self.quiet + 1
        if self.quiet >= 35 or len(self.frames) >= 600:
            # Discard most trailing silence, keep 200 ms for final consonants.
            frames = self.frames[:-25] if self.quiet >= 35 else self.frames
            if self.voiced >= 15:
                self.emit(Segment(b''.join(frames), time.monotonic(), len(frames)*.02))
            # At max duration keep a 300 ms overlap, without dropping a frame.
            tail = self.frames[-15:] if self.quiet < 35 else []
            self.reset()
            self.pre.extend(tail)
