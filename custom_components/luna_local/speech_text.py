"""Keep expressive reply text separate from words sent to a speech provider."""
import re

_EMOJI = re.compile(
    r"(?:[0-9#*]\ufe0f?\u20e3|[\U0001f000-\U0001faff\u2600-\u27bf]"
    r"[\ufe0e\ufe0f\U0001f3fb-\U0001f3ff]*"
    r"(?:\u200d[\U0001f000-\U0001faff\u2600-\u27bf][\ufe0e\ufe0f\U0001f3fb-\U0001f3ff]*)*"
    r"|[©®™]\ufe0f|[\U000e0020-\U000e007f])"
)
_EMOTICON = re.compile(r"(?<![\w/])(?:[:;=8][-^']?[)(DPp]|[xX]D|<3)(?!\w)")


def prepare_speech(text):
    """Return speech plus original markers, without changing numbers or URLs."""
    markers = []
    def remove(match):
        markers.append(match.group())
        return ' '
    speech = _EMOTICON.sub(remove, _EMOJI.sub(remove, str(text)))
    speech = re.sub(r'[ \t]+', ' ', speech)
    speech = re.sub(r' +([,.;:!?])', r'\1', speech).strip()
    return {'text': speech, 'original': str(text), 'markers': markers}


def clean_response(response):
    """HA passes speech.plain.speech to TTS; extra_data stays metadata only."""
    plain = response.speech.get('plain')
    if not plain or not isinstance(plain.get('speech'), str):
        return
    prepared = prepare_speech(plain['speech'])
    plain['speech'] = prepared['text']
    extra = plain.get('extra_data')
    plain['extra_data'] = {**(extra if isinstance(extra, dict) else {}),
                           'luna': {'original_reply': prepared['original'],
                                    'emotion_markers': prepared['markers']}}
