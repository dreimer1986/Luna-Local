import asyncio
import importlib.util
from pathlib import Path
import sys
import unittest
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

root = Path(__file__).parents[1]/'custom_components/luna_local'
def load(name):
    spec=importlib.util.spec_from_file_location(name,root/(name+'.py'))
    module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module)
    return module
audio=load('audio');dialogue=load('dialogue')
KEY=bytes(range(32)); BOOT=b'12345678'
def packet(seq,offset=None,boot=BOOT,pcm=b'\0'*640):
    h=audio.HEADER.pack(b'LUN2',1,boot,seq,seq*320 if offset is None else offset)
    return h+AESGCM(KEY).encrypt(h[8:20],pcm,h)
class AudioTests(unittest.TestCase):
    def test_authenticated_audio_replay_and_sample_loss(self):
        d=audio.Decoder(1,KEY.hex())
        self.assertEqual(d.decode(packet(0))[0],b'\0'*640)
        self.assertIsNone(d.decode(packet(0)))
        self.assertEqual(d.decode(packet(2))[2],320)
        self.assertEqual(d.lost_samples,320)
        changed=bytearray(packet(3));changed[-1]^=1
        self.assertIsNone(d.decode(bytes(changed)))
        self.assertEqual(d.received,2)
        self.assertIsNotNone(d.decode(packet(0,boot=b'87654321')))
        self.assertIsNone(d.decode(packet(3)))
    def test_new_device_key_cannot_decrypt_audio(self):
        d=audio.Decoder(1,bytes(reversed(KEY)).hex())
        self.assertIsNone(d.decode(packet(0)))
    def test_segmentation_keeps_receiving_without_consumer(self):
        class VAD:
            def is_speech(self,pcm,rate):return pcm[0]==1
        completed=[];s=audio.Segmenter(VAD(),completed.append)
        for _ in range(3):
            for _ in range(100):s.feed(b'\1'*640)
            for _ in range(40):s.feed(b'\0'*640)
        self.assertEqual(len(completed),3)
        self.assertTrue(all(x.duration>=2 for x in completed))
    def test_max_length_splits_continuous_speech_without_stopping(self):
        class VAD:
            def is_speech(self,pcm,rate):return True
        completed=[];s=audio.Segmenter(VAD(),completed.append)
        for _ in range(1500):s.feed(b'\1'*640)
        self.assertEqual(len(completed),2)
        self.assertGreater(len(s.frames),0)
    def test_memory_requests_do_not_need_a_name(self):
        self.assertEqual(dialogue.memory_command('Merke dir: Ich mag Kaffee.'), ('remember','Ich mag Kaffee.'))
        self.assertEqual(dialogue.memory_command('Luna, merke dir: Ich mag Tee.'), ('remember','Ich mag Tee.'))
        self.assertEqual(dialogue.memory_command('Vergiss Erinnerung 012345abcdef'), ('forget','012345abcdef'))
        self.assertIsNone(dialogue.memory_command('Weiß jemand, wie spät es ist?'))

    def test_echo_does_not_mute_a_different_interjection(self):
        outputs=['Der Himmel ist blau, weil Luft das blaue Licht stärker streut.']
        self.assertTrue(dialogue.is_echo(outputs[0],outputs))
        self.assertFalse(dialogue.is_echo('Warum sieht der Himmel abends rot aus?',outputs))
        self.assertFalse(dialogue.is_echo('Luna, hör bitte auf.',outputs))

if __name__=='__main__':unittest.main()
