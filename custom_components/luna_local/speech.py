"""Use the Voice device's selected primary Assist pipeline for STT and TTS.

Resolve afresh at each operation. Never silently substitute another provider:
that would both ignore the UI and potentially change local/cloud routing.
"""
import asyncio

from homeassistant.components import assist_pipeline, stt, tts
from homeassistant.components.tts.media_source import generate_media_source_id
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er


class SpeechConfigurationError(HomeAssistantError):
    """Selected speech settings cannot be used."""


class PipelineSpeech:
    def __init__(self, hass, device_id, media_player):
        self.hass, self.device_id, self.media_player = hass, device_id, media_player
        self.last_stt_engine = None
        self.last_tts_engine = None
        self.last_tts_voice = None

    def pipeline(self):
        registry = er.async_get(self.hass)
        selectors = [entry for entry in er.async_entries_for_device(registry, self.device_id)
                     if entry.platform == 'esphome' and entry.domain == 'select'
                     and entry.unique_id.endswith('-pipeline')]
        if len(selectors) != 1:
            raise SpeechConfigurationError('Erster Assistent des Voice-Geräts nicht eindeutig gefunden')
        state = self.hass.states.get(selectors[0].entity_id)
        if state is None or state.state in ('unavailable', 'unknown'):
            raise SpeechConfigurationError('Assistenten-Auswahl des Voice-Geräts nicht verfügbar')
        if state.state == assist_pipeline.OPTION_PREFERRED:
            return assist_pipeline.async_get_pipeline(self.hass, None)
        candidates = [pipeline for pipeline in assist_pipeline.async_get_pipelines(self.hass)
                      if pipeline.name == state.state]
        if len(candidates) != 1:
            raise SpeechConfigurationError('Ausgewählter Sprachassistent nicht eindeutig gefunden')
        return candidates[0]

    def describe(self):
        try:
            pipeline = self.pipeline()
            return {'sprachassistent': pipeline.name, 'sprachassistent_id': pipeline.id,
                    'stt_engine': pipeline.stt_engine, 'stt_sprache': pipeline.stt_language,
                    'tts_engine': pipeline.tts_engine, 'tts_sprache': pipeline.tts_language,
                    'tts_stimme': pipeline.tts_voice,
                    'sprachkonfiguration_fehler': None}
        except (HomeAssistantError, KeyError) as err:
            return {'sprachkonfiguration_fehler': str(err)}

    async def transcribe(self, audio):
        pipeline = self.pipeline()
        if not pipeline.stt_engine or not pipeline.stt_language:
            raise SpeechConfigurationError('Im ausgewählten Assistenten fehlt STT oder dessen Sprache')
        engine = stt.async_get_speech_to_text_engine(self.hass, pipeline.stt_engine)
        if engine is None:
            raise SpeechConfigurationError('Ausgewählte STT-Engine nicht verfügbar: '+pipeline.stt_engine)
        metadata = stt.SpeechMetadata(
            language=pipeline.stt_language, format=stt.AudioFormats.WAV,
            codec=stt.AudioCodecs.PCM, bit_rate=stt.AudioBitRates.BITRATE_16,
            sample_rate=stt.AudioSampleRates.SAMPLERATE_16000,
            channel=stt.AudioChannels.CHANNEL_MONO,
        )
        if not engine.check_metadata(metadata):
            raise SpeechConfigurationError('Ausgewählte STT-Engine unterstützt Sprache/PCM-Format nicht')

        async def stream():
            # HA's STT interface expects raw PCM; the provider adds a container
            # if necessary (e.g. Gemini's WAV upload).
            for offset in range(0, len(audio), 4096):
                yield audio[offset:offset+4096]

        self.last_stt_engine = pipeline.stt_engine
        async with asyncio.timeout(90):
            if isinstance(engine, stt.SpeechToTextEntity):
                result = await engine.internal_async_process_audio_stream(metadata, stream())
            else:
                result = await engine.async_process_audio_stream(metadata, stream())
        if result.result != stt.SpeechResultState.SUCCESS:
            raise SpeechConfigurationError('Spracherkennung fehlgeschlagen: '+pipeline.stt_engine)
        return (result.text or '').strip()

    def media_source(self, text):
        pipeline = self.pipeline()
        if not pipeline.tts_engine:
            raise SpeechConfigurationError('Im ausgewählten Assistenten fehlt die Sprachausgabe')
        engine = tts.async_resolve_engine(self.hass, pipeline.tts_engine)
        if engine is None:
            raise SpeechConfigurationError('Ausgewählte TTS-Engine nicht verfügbar: '+pipeline.tts_engine)
        options = {} if pipeline.tts_voice is None else {tts.ATTR_VOICE: pipeline.tts_voice}
        source = generate_media_source_id(
            self.hass, message=text, engine=engine, language=pipeline.tts_language,
            options=options, cache=False,
        )
        self.last_tts_engine, self.last_tts_voice = engine, pipeline.tts_voice
        return source

    async def speak(self, text):
        # Same media-source route as HA's tts.speak, including announcement
        # playback. Works for both current TTS entities and legacy providers.
        source = self.media_source(text)
        await self.hass.services.async_call('media_player', 'play_media', {
            'entity_id': self.media_player, 'media_content_id': source,
            'media_content_type': 'music', 'announce': True,
        }, blocking=True)
