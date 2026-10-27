import importlib.util
from pathlib import Path
import unittest
from types import SimpleNamespace
spec=importlib.util.spec_from_file_location('speech_text',Path(__file__).parents[1]/'custom_components/luna_local/speech_text.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class SpeechTextTests(unittest.TestCase):
    def test_markers_are_metadata_not_spoken_words(self):
        raw='Hallo 😸! Das freut mich ❤️ 👩🏽‍💻 :-)'
        result=mod.prepare_speech(raw)
        self.assertEqual(result['text'],'Hallo! Das freut mich')
        self.assertEqual(result['original'],raw)
        self.assertIn('👩🏽‍💻',result['markers'])
    def test_numbers_punctuation_and_urls_survive(self):
        raw='Um 18:30: 2,5 €; https://example.org/a. 1️⃣ Klasse!'
        self.assertEqual(mod.prepare_speech(raw)['text'],'Um 18:30: 2,5 €; https://example.org/a. Klasse!')
        self.assertEqual(mod.prepare_speech('🙂😸')['text'],'')
    def test_response_preserves_provider_metadata(self):
        r=SimpleNamespace(speech={'plain':{'speech':'Gern 😊','extra_data':{'provider':'local'}}})
        mod.clean_response(r)
        self.assertEqual(r.speech['plain']['speech'],'Gern')
        self.assertEqual(r.speech['plain']['extra_data']['provider'],'local')
        self.assertEqual(r.speech['plain']['extra_data']['luna']['original_reply'],'Gern 😊')
