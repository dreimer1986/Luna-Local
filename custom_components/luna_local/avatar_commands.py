"""Short-lived avatar commands shared by connected displays, without audio."""
import time
import uuid


class AvatarCommandRelay:
    def __init__(self, loop):
        self.loop = loop
        self.current = None
        self.timer = None
        self.listeners = set()

    def snapshot(self):
        if self.current and self.current['expires_at'] > time.time():
            return {**self.current, 'server_time': time.time()}
        return {'reset': True, 'server_time': time.time()}

    def publish(self):
        event = self.snapshot()
        for listener in tuple(self.listeners):
            try:
                listener(event)
            except Exception:
                self.listeners.discard(listener)

    def subscribe(self, listener):
        self.listeners.add(listener)
        return lambda: self.listeners.discard(listener)

    def start(self, pose, expression, intensity, duration):
        if self.timer:
            self.timer.cancel()
        now = time.time()
        self.current = {'id': uuid.uuid4().hex, 'pose': pose, 'expression': expression,
                        'intensity': intensity, 'started_at': now, 'expires_at': now + duration}
        self.timer = self.loop.call_later(duration, self.finish, self.current['id'])
        self.publish()
        return self.current['id']

    def finish(self, command_id):
        if self.current and self.current['id'] == command_id:
            self.reset()

    def reset(self):
        if self.timer:
            self.timer.cancel()
        self.timer = None
        self.current = None
        self.publish()
