"""HA environment tests; all actual control calls are mocked."""
import asyncio
import importlib
import os
import sys
import time
from pathlib import Path
import unittest
from types import SimpleNamespace as NS
from unittest.mock import AsyncMock, Mock, patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
pkg=os.environ.get('LUNA_TEST_PACKAGE','custom_components.luna_local')
mod=importlib.import_module(pkg+'.control')
continuous=importlib.import_module(pkg+'.continuous')

class ControlTests(unittest.IsolatedAsyncioTestCase):
    def test_direct_address_and_modes(self):
        for text in ['Licht Wohnzimmer an','Im Film sagt Luna Licht an','Hallo zusammen, Luna sagt Licht an']:
            self.assertIsNone(mod.permitted_text(text,mod.ADDRESSED))
        self.assertEqual(mod.permitted_text('Luna, Licht Wohnzimmer an',mod.ADDRESSED),'Licht Wohnzimmer an')
        self.assertEqual(mod.permitted_text('Hey Luna, spiele Musik',mod.ADDRESSED),'spiele Musik')
        self.assertIsNone(mod.permitted_text('Luna, Licht an',mod.OFF))
        self.assertIsNone(mod.permitted_text('Luna, Licht an','invalid'))
        self.assertEqual(mod.permitted_text('Licht an',mod.ALWAYS),'Licht an')
        self.assertEqual(mod.permitted_text('Licht an',mod.ADDRESSED,True),'Licht an')
        self.assertIsNone(mod.permitted_text('Licht an',mod.OFF,True))

    async def test_recognition_then_native_execution_with_room_context(self):
        agent=NS(async_recognize_intent=AsyncMock(return_value=object()))
        response=NS(response=NS(speech={'plain':{'speech':'Licht eingeschaltet.'}},response_type='action_done'))
        with patch.object(mod.conversation,'async_get_agent',return_value=agent), patch.object(mod.conversation,'async_converse',AsyncMock(return_value=response)) as execute:
            reply=await mod.async_control(NS(),'Licht an','device','satellite',lambda:True)
            self.assertEqual(reply,'Licht eingeschaltet.')
            self.assertTrue(agent.async_recognize_intent.call_args.kwargs['strict_intents_only'])
            self.assertEqual(execute.call_args.kwargs['device_id'],'device')
            self.assertEqual(execute.call_args.kwargs['agent_id'],mod.conversation.HOME_ASSISTANT_AGENT)

    async def test_changed_permission_during_recognition_prevents_execution(self):
        agent=NS(async_recognize_intent=AsyncMock(return_value=object()))
        with patch.object(mod.conversation,'async_get_agent',return_value=agent), patch.object(mod.conversation,'async_converse',AsyncMock()) as execute:
            self.assertIsNone(await mod.async_control(NS(),'Licht an','device','satellite',lambda:False))
            execute.assert_not_awaited()
            agent.async_recognize_intent.return_value=None
            self.assertIsNone(await mod.async_control(NS(),'Wie geht es dir?','device','satellite',lambda:True))
            execute.assert_not_awaited()

    def room(self):
        states=NS(is_state=lambda entity,state: (entity=='switch.test' and state=='on') or (entity=='switch.mute' and state=='off'),get=lambda entity:NS(state='idle'))
        runtime=NS(hass=NS(states=states),generation=0)
        cfg={'stream_id':1,'key':'00'*32,'device_id':'device','media_player':'media_player.test','switch':'switch.test','mute':'switch.mute','satellite':'assist_satellite.test','host':'127.0.0.1','name':'Test'}
        hub=continuous.ContinuousHub(runtime,[cfg]);room=hub.rooms[1];room.status_changed=lambda:None;room.control_mode=mod.ADDRESSED
        return room

    async def test_no_name_off_stale_and_duplicate_commands_never_execute(self):
        room=self.room();now=time.monotonic()
        with patch.object(continuous,'async_control',AsyncMock(return_value='Erledigt.')) as run:
            self.assertIsNone(await room.control('Licht an',0,0,now));run.assert_not_awaited()
            room.control_mode=mod.OFF
            self.assertIsNone(await room.control('Luna, Licht an',0,0,now));run.assert_not_awaited()
            room.control_mode=mod.ADDRESSED
            self.assertIsNone(await room.control('Luna, Licht an',0,0,now-31));run.assert_not_awaited()
            self.assertIsNone(await room.control('Luna, Licht an',1,0,now));run.assert_not_awaited()
            self.assertEqual(await room.control('Luna, Licht an',0,0,now),'Erledigt.')
            self.assertEqual(await room.control('Luna, Licht an',0,0,now),'')
            self.assertEqual(run.await_count,1)

    def test_activity_follows_processing_and_reverts_to_listening(self):
        room=self.room();room.decoder.last_packet=time.monotonic()
        self.assertEqual(room.activity(),'listening')
        room.stt_busy=True;self.assertEqual(room.activity(),'processing')
        room.tts_busy=True;self.assertEqual(room.activity(),'responding')
        room.reset();self.assertEqual(room.activity(),'listening')
        room.error_until=time.monotonic()+5;self.assertEqual(room.activity(),'error')
        room.runtime.hass.states.is_state=lambda *args:False
        self.assertEqual(room.activity(),'off')

if __name__=='__main__': unittest.main()
