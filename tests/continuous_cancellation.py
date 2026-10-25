"""HA-container tests for disabling capture during in-flight processing."""
import asyncio
import sys
from types import SimpleNamespace
sys.path.insert(0,'/config')
import importlib, os
package = os.environ.get('LUNA_TEST_PACKAGE','custom_components.luna_local')
ContinuousHub = importlib.import_module(package+'.continuous').ContinuousHub
Segment = importlib.import_module(package+'.audio').Segment

async def main():
    active=True;spoken=[]
    class States:
        def is_state(self,e,s):return active if e=='switch.test' else s=='off'
        def get(self,e):return SimpleNamespace(state='idle')
    async def service(*args,**kwargs):spoken.append(args)
    async def call(*args):return []
    async def changed():pass
    runtime=SimpleNamespace(hass=SimpleNamespace(states=States(),services=SimpleNamespace(async_call=service)),
        entry=SimpleNamespace(data={}),call=call,changed=changed,generation=0,memory_lock=asyncio.Lock())
    config={'device_id':'test-device','stream_id':1,'key':'00'*32,'name':'Test','host':'127.0.0.1','switch':'switch.test','mute':'switch.mute','satellite':'satellite.test','media_player':'media.test'}
    hub=ContinuousHub(runtime,[config]);room=hub.rooms[1]
    room.status_changed=lambda: None
    started=asyncio.Event();release=asyncio.Event()
    async def blocked_stt(audio):started.set();await release.wait();return 'Warum ist der Himmel blau?'
    room.transcribe=blocked_stt
    worker=asyncio.create_task(room.stt_worker())
    room.segment(Segment(b'\0'*640,0,.02));await started.wait()
    for _ in range(5):room.segment(Segment(b'\0'*640,0,.02))
    assert room.audio.qsize()==5,'Reception blocked behind STT'
    active=False;room.reset();release.set();await room.audio.join()
    assert room.text.empty() and room.audio.empty() and not spoken
    worker.cancel();await asyncio.gather(worker,return_exceptions=True)
    active=True;started.clear();release.clear()
    async def blocked_decision(text, utterances=None):started.set();await release.wait();return {'reply':'Antwort','remember':False}
    room.decide=blocked_decision
    worker=asyncio.create_task(room.dialog_worker())
    room.text.put_nowait((room.epoch,0,'Warum ist der Himmel blau?',False,0));await started.wait()
    active=False;room.reset();release.set();await room.text.join()
    assert not spoken,'Spoke after switch off'
    worker.cancel();await asyncio.gather(worker,return_exceptions=True)
    active=True;started.clear();release.clear()
    worker=asyncio.create_task(room.dialog_worker())
    room.text.put_nowait((room.epoch,0,'Was erinnerst du über mich?',False,0));await started.wait()
    runtime.generation=1  # Deleting a memory invalidates in-flight context.
    release.set();await room.text.join()
    assert not spoken,'Replied with context from before deletion'
    worker.cancel();await asyncio.gather(worker,return_exceptions=True)
    print('PASS: reception during blocked STT; disable clears queues and late replies; deletion invalidates in-flight context')
asyncio.run(main())
