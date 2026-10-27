"""Local acoustic gate and bounded clarification policy; never controls capture."""
import re
from pysilero_vad import SileroVoiceActivityDetector


class SpeechGate:
    """Called in an executor, once per candidate segment, with fresh VAD state."""
    def __init__(self):
        self.vad = None

    def check(self, pcm):
        if self.vad is None:
            self.vad = SileroVoiceActivityDetector()
        self.vad.reset()
        size = self.vad.chunk_bytes()
        probabilities = [self.vad(pcm[i:i+size].ljust(size, b'\0'))
                         for i in range(0, len(pcm), size)]
        # At least 160 ms probable speech and a 96 ms consecutive run.
        run = longest = voiced = 0
        for probability in probabilities:
            run = run + 1 if probability >= .5 else 0
            longest = max(longest, run)
            voiced += probability >= .5
        return voiced >= 5 and longest >= 3, round(max(probabilities, default=0), 3)


class PlaybackGate:
    """Discard acoustic self-echo while capture/transport keep running."""
    def __init__(self, tail=1.0):
        self.tail = tail
        self.until = float('-inf')

    def blocked(self, playing, now):
        if playing:
            self.until = now + self.tail
        return playing or now < self.until


class ReplyGuard:
    def __init__(self):
        self.last_clarification = float('-inf')
        self.last_reply = float('-inf')
        self.clarification_pending = False

    def apply(self, decision, text, now):
        kind = decision.get('kind', 'clear')
        # Empty STT is not evidence of an addressed utterance. Stay silent.
        if re.search(r'\[unverst(?:ä|ae)ndlich(?:e sprache)?\]', text, re.I):
            kind = 'noise'
            decision = dict(decision, kind=kind)
        if kind not in ('clear', 'unclear', 'noise'):
            raise ValueError('Invalid speech classification')
        if kind == 'clear':
            self.clarification_pending = False
            return decision, False
        result = dict(decision, reply='', remember=False, remember_indices=[])
        addressed = bool(re.search(r'\b(?:luna|jarvis)\b', text, re.I))
        expected = addressed or now-self.last_reply < 45 or decision.get('response_expected') is True
        clarify = kind == 'unclear' and expected and not self.clarification_pending and now-self.last_clarification >= 30
        if clarify:
            result['reply'] = 'Das habe ich akustisch nicht verstanden. Kannst du es bitte wiederholen?'
        return result, clarify

    def spoken(self, now, clarification):
        if not clarification:
            self.last_reply = now
        if clarification:
            self.clarification_pending = True
            self.last_clarification = now
