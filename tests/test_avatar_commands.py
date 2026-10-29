import asyncio
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('avatar_commands', Path(__file__).parents[1]/'custom_components/luna_local/avatar_commands.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class AvatarCommandTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.relay = module.AvatarCommandRelay(asyncio.get_running_loop())
        self.events = []
        self.relay.subscribe(self.events.append)
        self.addCleanup(self.relay.reset)

    def test_replacement_old_timer_and_reset(self):
        first = self.relay.start('wave', 'joyful', .7, 8)
        second = self.relay.start('arms_crossed', 'angry', .8, 12)
        self.relay.finish(first)
        self.assertEqual(self.relay.snapshot()['id'], second)
        self.relay.reset()
        self.assertTrue(self.events[-1]['reset'])
        self.assertIsNone(self.relay.timer)

    def test_snapshot_uses_remaining_lifetime_not_a_new_duration(self):
        with patch.object(module.time, 'time', return_value=100):
            self.relay.start('wave', 'neutral', .5, 8)
        with patch.object(module.time, 'time', return_value=105):
            event = self.relay.snapshot()
            self.assertEqual(event['expires_at']-event['server_time'], 3)
        with patch.object(module.time, 'time', return_value=109):
            self.assertTrue(self.relay.snapshot()['reset'])

    async def test_timer_actually_expires_and_unsubscribe_stops_events(self):
        received=[]
        unsubscribe=self.relay.subscribe(received.append)
        self.relay.start('wave','joyful',.5,.01)
        await asyncio.sleep(.03)
        self.assertTrue(received[-1]['reset'])
        unsubscribe();self.relay.start('neutral','neutral',0,1)
        self.assertEqual(len(received),2)
