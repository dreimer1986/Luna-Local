"""Run in the HA container; no real microphone, speaker or cloud calls."""
import asyncio
import sys
from types import SimpleNamespace as NS
import unittest
from unittest.mock import AsyncMock, Mock, patch
sys.path.insert(0,'/config')
import importlib, os
mod = importlib.import_module(os.environ.get('LUNA_TEST_PACKAGE','custom_components.luna_local')+'.speech')


class SpeechAdapterTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.state=NS(state='Local')
        self.hass=NS(states=NS(get=lambda eid:self.state),services=NS(async_call=AsyncMock()))
        self.local=NS(id='local',name='Local',stt_engine='stt.whisper',stt_language='de',tts_engine='tts.piper',tts_language='de_DE',tts_voice='kerstin')
        self.google=NS(id='google',name='Google',stt_engine='stt.google',stt_language='de-DE',tts_engine='tts.google',tts_language='de-DE',tts_voice='callirrhoe')
        self.entries=[NS(platform='esphome',domain='select',unique_id='MAC-pipeline_2',entity_id='select.secondary'),NS(platform='esphome',domain='select',unique_id='MAC-pipeline',entity_id='select.primary')]
        self.patches=[patch.object(mod.er,'async_get',return_value=object()),patch.object(mod.er,'async_entries_for_device',side_effect=lambda registry,device:self.entries),patch.object(mod.assist_pipeline,'async_get_pipelines',return_value=[self.local,self.google]),patch.object(mod.assist_pipeline,'async_get_pipeline',return_value=self.google)]
        for p in self.patches:p.start();self.addCleanup(p.stop)
        self.adapter=mod.PipelineSpeech(self.hass,'device','media_player.room')

    def test_primary_slot_uses_registry_and_renamed_entity(self):
        seen=[]
        self.hass.states.get=lambda eid:seen.append(eid) or self.state
        self.entries[1].entity_id='select.renamed_primary'
        self.assertEqual(self.adapter.pipeline().id,'local')
        self.assertEqual(seen,['select.renamed_primary'])

    def test_provider_and_voice_edits_are_read_without_reload(self):
        self.assertEqual(self.adapter.describe()['tts_stimme'],'kerstin')
        self.local.tts_engine='tts.google';self.local.tts_voice='callirrhoe';self.local.stt_engine='stt.google'
        self.assertEqual(self.adapter.describe()['tts_stimme'],'callirrhoe')
        self.assertEqual(self.adapter.describe()['stt_engine'],'stt.google')
        self.state.state='Google';self.assertEqual(self.adapter.pipeline().id,'google')

    def test_preferred_only_when_explicitly_selected(self):
        self.state.state=mod.assist_pipeline.OPTION_PREFERRED
        self.assertEqual(self.adapter.pipeline().id,'google')
        mod.assist_pipeline.async_get_pipeline.assert_called_once_with(self.hass,None)

    def test_missing_selection_never_falls_back(self):
        for value in ['unavailable','unknown','Deleted assistant']:
            self.state.state=value
            with self.assertRaises(mod.SpeechConfigurationError):self.adapter.pipeline()
        mod.assist_pipeline.async_get_pipeline.assert_not_called()
        self.entries=[]
        self.assertIsNotNone(self.adapter.describe()['sprachkonfiguration_fehler'])

    async def test_stt_routes_pcm_and_language_to_selected_entity(self):
        calls=[]
        engine=Mock(spec=mod.stt.SpeechToTextEntity)
        engine.check_metadata.return_value=True
        async def process(metadata,stream):
            calls.append((metadata,b''.join([part async for part in stream])))
            return NS(result=mod.stt.SpeechResultState.SUCCESS,text=' Hallo ')
        engine.internal_async_process_audio_stream=process
        with patch.object(mod.stt,'async_get_speech_to_text_engine',return_value=engine) as lookup:
            self.assertEqual(await self.adapter.transcribe(b'\x01\x00'*5000),'Hallo')
            self.state.state='Google';await self.adapter.transcribe(b'\0'*640)
            self.assertEqual([c.args[1] for c in lookup.call_args_list],['stt.whisper','stt.google'])
        self.assertEqual(calls[0][0].language,'de');self.assertEqual(calls[1][0].language,'de-DE')
        self.assertEqual(calls[0][1],b'\x01\x00'*5000)
        self.assertEqual(calls[1][0].sample_rate,16000)
        self.assertEqual(self.adapter.last_stt_engine,'stt.google')

    async def test_failed_stt_and_incompatible_audio_do_not_fall_back(self):
        engine=Mock(spec=mod.stt.SpeechToTextEntity)
        engine.check_metadata.return_value=True
        engine.internal_async_process_audio_stream=AsyncMock(return_value=NS(result=mod.stt.SpeechResultState.ERROR,text=None))
        with patch.object(mod.stt,'async_get_speech_to_text_engine',return_value=engine):
            with self.assertRaises(mod.SpeechConfigurationError):await self.adapter.transcribe(b'\0'*640)
            engine.check_metadata.return_value=False
            with self.assertRaises(mod.SpeechConfigurationError):await self.adapter.transcribe(b'\0'*640)
        engine.internal_async_process_audio_stream.assert_awaited_once()

    async def test_tts_uses_selected_voice_language_and_announcement(self):
        self.state.state='Google'
        with patch.object(mod.tts,'async_resolve_engine',side_effect=lambda hass,engine:engine),patch.object(mod,'generate_media_source_id',return_value='media-source://tts/test') as generate:
            await self.adapter.speak('Ein Test.')
            self.assertEqual(generate.call_args.kwargs['engine'],'tts.google')
            self.assertEqual(generate.call_args.kwargs['language'],'de-DE')
            self.assertEqual(generate.call_args.kwargs['options'],{'voice':'callirrhoe'})
            self.google.tts_voice=None
            await self.adapter.speak('Noch ein Test.')
            self.assertEqual(generate.call_args.kwargs['options'],{})
        call=self.hass.services.async_call.call_args
        self.assertEqual(call.args[:2],('media_player','play_media'))
        self.assertTrue(call.args[2]['announce'])
        self.assertEqual(call.args[2]['entity_id'],'media_player.room')

    def test_tts_missing_engine_is_an_error(self):
        with patch.object(mod.tts,'async_resolve_engine',return_value=None),patch.object(mod,'generate_media_source_id') as generate:
            with self.assertRaises(mod.SpeechConfigurationError):self.adapter.media_source('Test')
            generate.assert_not_called()

if __name__=='__main__':unittest.main(verbosity=2)
