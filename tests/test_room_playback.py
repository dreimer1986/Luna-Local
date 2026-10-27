import asyncio
import importlib.util
from pathlib import Path
import sys
from types import SimpleNamespace as NS
import unittest
from unittest.mock import Mock,patch
spec=importlib.util.spec_from_file_location('room_playback',Path(__file__).parents[1]/'custom_components/luna_local/room_playback.py')
mod=importlib.util.module_from_spec(spec)
with patch.dict(sys.modules,{'homeassistant.core':NS(callback=lambda f:f)}):spec.loader.exec_module(mod)
class RoomPlaybackTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.states={'media_player.a':NS(state='idle'),'media_player.b':NS(state='idle')}
        self.hass=NS(loop=asyncio.get_running_loop(),states=NS(get=self.states.get),bus=NS(async_listen=Mock(return_value=Mock())))
        self.rooms=[{'device_id':n,'name':n,'media_player':'media_player.'+n,'mute':'switch.mute_'+n,'switch':'switch.listen_'+n} for n in ['a','b']]
        self.relay=mod.RoomPlaybackRelay(self.hass,self.rooms);self.addCleanup(self.relay.close)
        self.events=[];self.relay.subscribe(self.events.append)
    def prepare(self,n='a'):
        return self.relay.prepare(n,'media_player.'+n,'/api/tts_proxy/token',{'text':'Hallo','original':'Hallo 😸','markers':['😸']})
    def change(self,entity,state):
        self.relay.state_changed(NS(data={'entity_id':entity,'new_state':NS(state=state)}))
    def test_actual_player_start_stop_and_snapshot(self):
        j=self.prepare();self.relay.dispatched(j)
        self.assertEqual(j['phase'],'preparing')
        self.change('media_player.other','playing');self.assertEqual(j['phase'],'preparing')
        self.change('media_player.a','playing');self.assertEqual(j['phase'],'speaking')
        self.assertIsNotNone(self.relay.snapshot()[0]['started_at'])
        self.change('media_player.a','idle');self.assertEqual(self.events[-1]['phase'],'idle')
        self.assertEqual(self.relay.snapshot(),[])
    def test_rooms_replacement_and_old_stop_are_isolated(self):
        old=self.prepare();other=self.prepare('b');new=self.prepare()
        self.relay.stop(old);self.assertIs(self.relay.jobs['a'],new)
        self.change('switch.mute_a','on');self.assertNotIn('a',self.relay.jobs)
        self.assertIs(self.relay.jobs['b'],other)
        self.change('switch.listen_b','off');self.assertEqual(self.relay.jobs,{})
    def test_no_external_audio_or_unknown_device(self):
        data={'text':'x','original':'x','markers':[]}
        self.assertIsNone(self.relay.prepare('a','media_player.a','https://other/api/tts_proxy/x',data))
        self.assertIsNone(self.relay.prepare('other','media_player.a','/api/tts_proxy/x',data))
