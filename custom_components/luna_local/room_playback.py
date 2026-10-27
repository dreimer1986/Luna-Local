"""Transient playback metadata for the avatar; never replay sound in the browser."""
import time
import uuid
from urllib.parse import urlsplit
from homeassistant.core import callback


class RoomPlaybackRelay:
    def __init__(self, hass, rooms):
        self.hass = hass
        self.rooms = {r['device_id']: r for r in rooms}
        self.jobs = {}
        self.listeners = set()
        self.timers = {}
        self.unsubscribe = hass.bus.async_listen('state_changed', self.state_changed)

    def publish(self, job):
        event = {**job, 'server_time': time.time()}
        for listener in tuple(self.listeners):
            try:
                listener(event)
            except Exception:
                self.listeners.discard(listener)

    def snapshot(self):
        return [{**job, 'server_time': time.time()} for job in self.jobs.values()]

    def subscribe(self, listener):
        self.listeners.add(listener)
        return lambda: self.listeners.discard(listener)

    def prepare(self, device_id, player, url, prepared):
        room = self.rooms.get(device_id)
        if room is None or room['media_player'] != player:
            return None
        parsed = urlsplit(url)
        if parsed.netloc or not parsed.path.startswith('/api/tts_proxy/'):
            return None
        self.cancel_device(device_id)
        job = {'id': uuid.uuid4().hex, 'device_id': device_id, 'room': room['name'],
               'player': player, 'url': url, 'phase': 'preparing', 'started_at': None,
               'text': prepared['text'][:3000], 'original_reply': prepared['original'][:3000],
               'emotion_markers': prepared['markers'][:32]}
        self.jobs[device_id] = job
        self.timers[job['id']] = self.hass.loop.call_later(30, self.stop, job)
        self.publish(job)
        return job

    def start(self, job):
        if self.jobs.get(job['device_id']) is not job or job['phase'] == 'speaking':
            return
        job.update(phase='speaking', started_at=time.time())
        self.timers.pop(job['id']).cancel()
        self.timers[job['id']] = self.hass.loop.call_later(300, self.stop, job)
        self.publish(job)

    def dispatched(self, job):
        if self.jobs.get(job['device_id']) is not job:
            return
        state = self.hass.states.get(job['player'])
        if state is not None and state.state == 'playing':
            self.start(job)

    @callback
    def state_changed(self, event):
        new = event.data.get('new_state')
        entity_id = event.data.get('entity_id')
        for job in tuple(self.jobs.values()):
            room = self.rooms[job['device_id']]
            if entity_id in (room.get('mute'), room.get('switch')):
                if new is None or (entity_id == room.get('mute') and new.state != 'off') or (entity_id == room.get('switch') and new.state != 'on'):
                    self.stop(job)
            elif entity_id == job['player']:
                if new is not None and new.state == 'playing':
                    self.start(job)
                elif job['phase'] == 'speaking' or new is None or new.state in ('unavailable','off'):
                    self.stop(job)

    def stop(self, job):
        if self.jobs.get(job['device_id']) is not job:
            return
        self.jobs.pop(job['device_id'])
        timer = self.timers.pop(job['id'], None)
        if timer:
            timer.cancel()
        self.publish({**job, 'phase': 'idle'})

    def cancel_device(self, device_id):
        if job := self.jobs.get(device_id):
            self.stop(job)

    def close(self):
        for job in tuple(self.jobs.values()):
            self.stop(job)
        self.unsubscribe()
        for listener in tuple(self.listeners):
            listener({"reset": True})
        self.listeners.clear()
