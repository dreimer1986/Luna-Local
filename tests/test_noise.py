import importlib.util
from pathlib import Path
import random
import struct
import unittest
spec = importlib.util.spec_from_file_location('noise', Path(__file__).parents[1]/'custom_components/luna_local/noise.py')
noise = importlib.util.module_from_spec(spec)
spec.loader.exec_module(noise)

class NoiseTests(unittest.TestCase):
    def test_silence_and_seeded_noise_are_rejected(self):
        gate = noise.SpeechGate()
        self.assertFalse(gate.check(bytes(32000))[0])
        rng = random.Random(42)
        pcm = struct.pack('<16000h', *(rng.randint(-3000,3000) for _ in range(16000)))
        self.assertFalse(gate.check(pcm)[0])

    def test_unclear_without_context_is_quiet_and_not_remembered(self):
        guard = noise.ReplyGuard()
        result, clarify = guard.apply({'kind':'unclear','reply':'invented','remember':True,'remember_indices':[0]}, '???', 100)
        self.assertEqual(result['reply'], '')
        self.assertFalse(result['remember'])
        self.assertEqual(result['remember_indices'], [])
        self.assertFalse(clarify)

    def test_address_context_and_cooldown(self):
        guard = noise.ReplyGuard()
        unclear = {'kind':'unclear'}
        result, clarify = guard.apply(unclear, 'Luna ...', 100)
        self.assertTrue(clarify)
        guard.spoken(100, clarify)
        self.assertFalse(guard.apply(unclear, 'Luna ...', 110)[1])
        self.assertFalse(guard.apply(unclear, '???', 131)[1])
        self.assertFalse(guard.apply(unclear, '???', 200)[1])
        self.assertFalse(guard.apply(dict(unclear,response_expected=True), 'Kann jemand ...', 200)[1])
        guard.apply({'kind':'clear'}, 'Wie spaet ist es?', 201)
        self.assertTrue(guard.apply(dict(unclear,response_expected=True), 'Kann jemand ...', 202)[1])

    def test_noise_never_clarifies_even_in_dialogue(self):
        guard = noise.ReplyGuard(); guard.spoken(100,False)
        self.assertFalse(guard.apply({'kind':'noise','response_expected':True}, 'Luna',101)[1])

    def test_empty_stt_placeholder_never_requests_repetition(self):
        guard = noise.ReplyGuard()
        guard.spoken(100, False)
        result, clarify = guard.apply({'kind':'noise','remember':True}, '[Unverständliche Sprache]',101)
        self.assertFalse(clarify)
        self.assertEqual(result['kind'],'noise')
        self.assertEqual(result['reply'], '')
        self.assertFalse(result['remember'])

    def test_clear_room_question_needs_no_name(self):
        decision={'kind':'clear','reply':'Vier.','remember':False}
        self.assertEqual(noise.ReplyGuard().apply(decision,'Was ist zwei plus zwei?',100), (decision,False))

    def test_clarification_does_not_extend_conversation_window(self):
        guard = noise.ReplyGuard()
        guard.spoken(100, False)
        self.assertTrue(guard.apply({'kind': 'unclear'}, '???', 131)[1])
        guard.spoken(131, True)
        self.assertFalse(guard.apply({'kind': 'unclear'}, '???', 162)[1])

    def test_playback_and_tail_rejected_then_listening_resumes(self):
        gate = noise.PlaybackGate()
        self.assertFalse(gate.blocked(False, 10))
        self.assertTrue(gate.blocked(True, 11))
        self.assertTrue(gate.blocked(True, 30))
        self.assertTrue(gate.blocked(False, 30.9))
        self.assertFalse(gate.blocked(False, 31.1))
