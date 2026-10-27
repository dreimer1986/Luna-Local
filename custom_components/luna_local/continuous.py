"""Continuous room audio: receive -> VAD -> STT -> dialogue -> TTS.

Each arrow is a queue or independent coroutine. No processing or playback
operation controls the device microphone. Queues are bounded and observable.
"""
import asyncio
from collections import deque
from contextlib import suppress
import json
import logging
import struct
import time

import aiohttp
import webrtcvad
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event

from .audio import Decoder, Segmenter
from .control import OFF, permitted_text, async_control
from .noise import SpeechGate, ReplyGuard, PlaybackGate
from .speech import PipelineSpeech, SpeechConfigurationError
from .room_playback import RoomPlaybackRelay
from .dialogue import ROOM_PROMPT, is_echo, memory_command
from .memory import explicit_personal_fact, should_extract
from .ollama_runtime import KEEP_ALIVE, inference_timings

LOGGER = logging.getLogger(__name__)


class Room:
    def __init__(self, hub, config):
        self.hub, self.runtime, self.config = hub, hub.runtime, config
        self.decoder = Decoder(config['stream_id'], config['key'])
        self.speech = PipelineSpeech(self.runtime.hass, config['device_id'], config['media_player'])
        self.audio = asyncio.Queue(maxsize=60)
        self.text = asyncio.Queue(maxsize=60)
        self.segmenter = Segmenter(webrtcvad.Vad(2), self.segment)
        self.gate = SpeechGate()
        self.guard = ReplyGuard()
        self.playback_gate = PlaybackGate()
        self.playback_frames = self.empty_transcripts = 0
        self.noise_segments = self.unclear_segments = 0
        self.speech_probability = None
        self.control_mode = OFF  # Fail closed until the Select restores its saved permission.
        self.stt_busy = self.dialog_busy = self.tts_busy = False
        self.error_until = 0.0
        self.commands = 0
        self.epoch = 0
        self.history = deque(maxlen=16)
        self.history_generation = self.runtime.generation
        self.outputs = deque(maxlen=8)
        self.segment_busy = False
        self.dropped_audio = self.dropped_text = self.transcripts = self.responses = self.echoes = 0
        self.last_error = None
        self.last_decision = 'noch keine Äußerung'
        self.stt_seconds = self.dialog_seconds = self.oldest_seconds = 0
        self.model_timings = {}
        self.tasks = []

    def active(self):
        states = self.runtime.hass.states
        return states.is_state(self.config['switch'], 'on') and states.is_state(self.config['mute'], 'off')

    def busy(self):
        state = self.runtime.hass.states.get(self.config['satellite'])
        return state is None or state.state != 'idle'

    def status_changed(self):
        async_dispatcher_send(self.runtime.hass, 'luna_local_updated')

    def activity(self):
        if not self.active():
            return 'off'
        if time.monotonic() < self.error_until:
            return 'error'
        if self.tts_busy:
            return 'responding'
        if self.stt_busy or self.dialog_busy or self.audio.qsize() or self.text.qsize():
            return 'processing'
        if not self.decoder.last_packet or time.monotonic()-self.decoder.last_packet > 3:
            return 'error'
        return 'listening'

    async def control(self, text, epoch, generation, ended):
        mode = self.control_mode
        command = permitted_text(text, mode)
        if not command:
            return None
        def allowed():
            return (self.active() and self.epoch == epoch and self.runtime.generation == generation
                    and self.control_mode == mode and not self.busy()
                    and time.monotonic()-ended <= 30)
        async with self.hub.control_lock:
            if not allowed():
                return None
            # One utterance heard by two rooms must not start playback twice.
            key = ' '.join(command.casefold().split())
            if time.monotonic()-self.hub.recent_commands.get(key, float('-inf')) < 5:
                return ''
            reply = await async_control(self.runtime.hass, command, self.config['device_id'],
                                        self.config['satellite'], allowed)
            if reply is not None:
                now = time.monotonic()
                self.hub.recent_commands = {k:v for k,v in self.hub.recent_commands.items() if now-v < 5}
                self.hub.recent_commands[key] = now
                self.commands += 1
            return reply

    def reset(self):
        relay = getattr(self.hub, "playback", None)
        if relay is not None:
            relay.cancel_device(self.config["device_id"])
        self.epoch += 1
        self.segmenter.reset()
        self.segment_busy = False
        self.history.clear()
        self.stt_busy = self.dialog_busy = self.tts_busy = False
        self.guard = ReplyGuard()
        for queue in (self.audio, self.text):
            while not queue.empty():
                queue.get_nowait();queue.task_done()

    def receive(self, packet):
        result = self.decoder.decode(packet)
        if result is None or not self.active():
            return
        pcm, fresh, gap = result
        # TTS service completion does not mean the physical speaker is finished.
        # The relay follows the real player state; include preparation and other
        # rooms so two nearby satellites cannot keep one another talking.
        relay = getattr(self.hub, 'playback', None)
        output_active = bool(relay and relay.jobs) or any(r.tts_busy for r in self.hub.rooms.values())
        if self.playback_gate.blocked(output_active, time.monotonic()):
            self.playback_frames += 1
            self.segmenter.reset()
            self.segment_busy = False
            return
        if fresh or gap:
            self.segmenter.reset()
            self.segment_busy = False
        self.segment_busy |= self.busy()
        self.segmenter.feed(pcm)
        if not self.segmenter.frames:
            self.segment_busy = False

    def segment(self, segment):
        try:
            self.audio.put_nowait((self.epoch, segment, self.segment_busy, self.runtime.generation))
        except asyncio.QueueFull:
            self.dropped_audio += 1
            self.last_error = 'Spracherkennung überlastet: Audioabschnitt verworfen'

    async def transcribe(self, audio):
        async with self.hub.stt_lock:
            accepted, probability = await self.runtime.hass.async_add_executor_job(self.gate.check, audio)
            self.speech_probability = probability
            if not accepted:
                self.noise_segments += 1
                self.last_decision = 'Geräuschfilter: keine ausreichende Sprache'
                return None
            return await self.speech.transcribe(audio)

    async def stt_worker(self):
        while True:
            epoch, segment, busy, generation = await self.audio.get()
            try:
                if epoch != self.epoch or not self.active():
                    continue
                self.stt_busy = True
                self.status_changed()
                self.oldest_seconds = time.monotonic() - segment.ended
                start = time.monotonic()
                text = await self.transcribe(segment.audio)
                self.stt_seconds = round(time.monotonic()-start, 2)
                if epoch != self.epoch or not self.active() or text is None:
                    continue
                if not text.strip():
                    self.empty_transcripts += 1
                    self.last_decision = 'Leere Spracherkennung: keine Antwort'
                    continue
                self.transcripts += 1
                recent = [value for room in self.hub.rooms.values() for stamp,value in room.outputs if time.monotonic()-stamp < 90]
                if is_echo(text, recent):
                    self.echoes += 1
                    self.last_decision = "Echo-ähnliches Transkript"
                    continue
                try:
                    self.text.put_nowait((epoch, segment.ended, text, busy, generation))
                except asyncio.QueueFull:
                    self.dropped_text += 1
                    self.last_error = 'Gesprächsmodell überlastet: Transkript verworfen'
            except asyncio.CancelledError:
                raise
            except Exception as err:
                self.error_until = time.monotonic()+5
                self.last_error = 'Spracherkennung: '+(str(err) if isinstance(err, SpeechConfigurationError) else type(err).__name__)
                LOGGER.warning('Continuous STT failed for %s: %s', self.config['name'], type(err).__name__)
            finally:
                self.audio.task_done()
                self.stt_busy = False
                self.status_changed()

    async def decide(self, text, utterances=None):
        if self.history_generation != self.runtime.generation:
            self.history.clear()
            self.history_generation = self.runtime.generation
        memories = await self.runtime.call('recall', text, 6)
        memory_data = json.dumps(memories, ensure_ascii=False)[:2000]
        context = json.dumps([{'speaker':item['speaker'],'text':item['text'][:240]} for item in list(self.history)[-8:]], ensure_ascii=False)
        utterances = utterances or [text]
        batch_data = json.dumps([{'index':i,'text':value[:320]} for i,value in enumerate(utterances)],ensure_ascii=False)
        messages = [
            {'role':'system','content':ROOM_PROMPT + '\nDie neuen Äußerungen können gebündelt eintreffen. Nutze alle als Gesprächskontext und antworte passend zum aktuellen Stand. Zusätzlich remember_indices: Liste der Indizes neuer Äußerungen mit ausdrücklich genannten langfristigen Fakten, die gespeichert werden sollen. remember bezieht sich nur auf die neueste Äußerung.'},
            {'role':'user','content':f'Erinnerungen (Daten): {memory_data}\nGespräch bisher (Daten): {context}\nNeue Äußerungen (Daten): '+batch_data},
        ]
        body = {'model':self.runtime.entry.data['model'], 'stream':False, 'think':False,
                'messages':messages, 'format':{'type':'object','properties':{'reply':{'type':'string'},'remember':{'type':'boolean'},'remember_indices':{'type':'array','items':{'type':'integer'}},'kind':{'type':'string','enum':['clear','unclear','noise']},'response_expected':{'type':'boolean'}},'required':['reply','remember','remember_indices','kind','response_expected']},
                'options':{'temperature':.2,'num_ctx':4096,'num_predict':220},'keep_alive':KEEP_ALIVE}
        session = async_get_clientsession(self.runtime.hass)
        async with session.post(self.runtime.entry.data['url'].rstrip('/')+'/api/chat', json=body, timeout=aiohttp.ClientTimeout(total=120)) as response:
            response.raise_for_status()
            result = await response.json()
        self.model_timings = inference_timings(result)
        decision = json.loads(result['message']['content'])
        if (not isinstance(decision.get('reply'), str) or not isinstance(decision.get('remember'), bool)
                or decision.get('kind') not in ('clear', 'unclear', 'noise')
                or not isinstance(decision.get('response_expected'), bool)):
            raise ValueError('Ungültige Gesprächsentscheidung')
        return decision

    async def dialog_worker(self):
        while True:
            batch = [await self.text.get()]
            while len(batch) < 12 and not self.text.empty():
                batch.append(self.text.get_nowait())
            try:
                valid = [item for item in batch if item[0] == self.epoch]
                if not valid or not self.active() or valid[-1][4] != self.runtime.generation:
                    continue
                epoch, ended, text, busy, generation = valid[-1]
                self.dialog_busy = True
                self.status_changed()
                start = time.monotonic()
                acknowledgement = None
                # Process native commands individually, never let an LLM compose service calls.
                controlled = False
                for item_epoch, item_ended, value, item_busy, item_generation in valid:
                    if not item_busy:
                        result = await self.control(value, item_epoch, item_generation, item_ended)
                        if result is not None:
                            acknowledgement = result
                            controlled = True
                for item_epoch, _, value, _, item_generation in valid:
                    command = memory_command(value)
                    if command and command[0] == 'remember':
                        await self.save_fact(command[1], item_epoch, item_generation, explicit=True)
                        acknowledgement = 'Das habe ich dauerhaft gespeichert.'
                    elif command and command[0] == 'forget':
                        async with self.runtime.memory_lock:
                            self.runtime.generation += 1
                            deleted = await self.runtime.call('forget', command[1])
                        for room in self.hub.rooms.values():
                            room.history.clear()
                        await self.runtime.changed()
                        generation = self.runtime.generation
                        acknowledgement = 'Die Erinnerung wurde gelöscht.' if deleted else 'Diese Erinnerung habe ich nicht gefunden.'
                    # Automatic memories are saved only after speech classification.
                if controlled or (len(valid) == 1 and acknowledgement):
                    decision = {'reply':acknowledgement or '', 'remember':False,'remember_indices':[]}
                else:
                    decision = await self.decide(text, [item[2] for item in valid])
                self.dialog_seconds = round(time.monotonic()-start, 2)
                if epoch != self.epoch or not self.active() or generation != self.runtime.generation:
                    continue
                decision, clarification = self.guard.apply(decision, text, time.monotonic())
                if decision.get('kind', 'clear') != 'clear':
                    self.unclear_segments += 1
                indices = decision.get('remember_indices', [])
                if not isinstance(indices, list):
                    raise ValueError('Ungültige Erinnerungsauswahl')
                if decision.get('kind', 'clear') == 'clear':
                    if explicit_personal_fact(text):
                        indices.append(len(valid)-1)
                if decision['remember']:
                    indices.append(len(valid)-1)
                for index in set(i for i in indices if type(i) is int and 0 <= i < len(valid)):
                    item_epoch, _, value, _, item_generation = valid[index]
                    if should_extract(value):
                        await self.save_fact(value, item_epoch, item_generation)
                for item in valid:
                    if item[4] != self.runtime.generation or decision.get('kind', 'clear') != 'clear':
                        continue
                    self.history.append({'speaker':'unbekannt','text':item[2][:2000]})
                reply = decision['reply'].strip()[:800]
                self.last_decision = ('Modell: kein Beitrag' if not reply else 'Assist aktiv' if any(item[3] for item in valid) or self.busy() else 'Antwort zu spät' if time.monotonic()-ended > 90 else 'Neuere Äußerungen warten' if self.text.qsize() else 'Antwort vorbereitet')
                # Capture continues even while model/TTS are busy. Do not speak
                # stale results over a newer turn or explicit Assist/Gemini.
                if reply and not any(item[3] for item in valid) and not self.busy() and time.monotonic()-ended <= 90 and self.text.qsize() == 0:
                    self.outputs.append((time.monotonic(), reply))
                    self.tts_busy = True
                    self.status_changed()
                    await self.speech.speak(reply)
                    self.tts_busy = False
                    self.guard.spoken(time.monotonic(), clarification)
                    self.responses += 1
                    self.last_decision = "Antwort an Sprachausgabe übergeben"
                    self.history.append({'speaker':'Luna','text':reply})
                self.last_error = None
            except asyncio.CancelledError:
                raise
            except Exception as err:
                self.error_until = time.monotonic()+5
                self.last_error = 'Gespräch: '+(str(err) if isinstance(err, SpeechConfigurationError) else type(err).__name__)
                LOGGER.warning('Continuous dialogue failed for %s: %s', self.config['name'], type(err).__name__)
            finally:
                self.dialog_busy = self.tts_busy = False
                self.status_changed()
                for _ in batch:
                    self.text.task_done()

    async def save_fact(self, text, epoch, generation, explicit=False):
        async with self.runtime.memory_lock:
            if epoch == self.epoch and generation == self.runtime.generation and self.active():
                await self.runtime.call('add', text[:2000], self.config['name']+' | Sprecher nicht identifiziert; wörtliche Äußerung', explicit)
        await self.runtime.changed()

    def stats(self):
        age = None if not self.decoder.last_packet else round(time.monotonic()-self.decoder.last_packet,1)
        return {**self.speech.describe(),
                'zuletzt_stt_engine':self.speech.last_stt_engine,
                'zuletzt_tts_engine':self.speech.last_tts_engine,
                'zuletzt_tts_stimme':self.speech.last_tts_voice,
                'geraeuschfilter_verworfen':self.noise_segments,
                'eigene_ausgabe_frames_verworfen':self.playback_frames,
                'leere_transkripte_verworfen':self.empty_transcripts,
                'unklare_abschnitte':self.unclear_segments,
                'sprachwahrscheinlichkeit_max':self.speech_probability,
                'aktivitaet':self.activity(), 'haussteuerung':self.control_mode,
                'hausbefehle':self.commands, 'aktiv':self.active(), 'pakete':self.decoder.received,
                'letztes_paket_vor_s':age,'verlorene_samples':self.decoder.lost_samples,
                'abgewiesene_pakete':self.decoder.rejected,'audio_warteschlange':self.audio.qsize(),
                'text_warteschlange':self.text.qsize(),'audio_verworfen':self.dropped_audio,
                'text_verworfen':self.dropped_text,'transkripte':self.transcripts,'antworten':self.responses,
                'echo_transkripte':self.echoes,'stt_sekunden':self.stt_seconds,
                'modell_sekunden':self.dialog_seconds,'rueckstau_sekunden':round(self.oldest_seconds,1),
                'letzte_llm_messwerte':self.model_timings,
                'letzter_fehler':self.last_error,'letzte_entscheidung':self.last_decision}


class ContinuousHub(asyncio.DatagramProtocol):
    def __init__(self, runtime, configs):
        self.runtime = runtime
        self.rooms = {c['stream_id']:Room(self,c) for c in configs}
        self.stt_lock = asyncio.Lock()
        self.control_lock = asyncio.Lock()
        self.recent_commands = {}
        self.transport = None
        self.unsubscribe = None
        self.unsubscribe_stop = None
        self.tasks = []

    async def start(self):
        self.playback = RoomPlaybackRelay(self.runtime.hass, [r.config for r in self.rooms.values()])
        self.runtime.hass.data['luna_local_avatar']['playback'] = self.playback
        self.transport, _ = await asyncio.get_running_loop().create_datagram_endpoint(lambda:self, local_addr=('0.0.0.0',12101))
        entities = [r.config[key] for r in self.rooms.values() for key in ('switch','mute')]
        self.unsubscribe = async_track_state_change_event(self.runtime.hass, entities, self.state_changed)
        for room in self.rooms.values():
            for coro in (room.stt_worker(), room.dialog_worker()):
                self.tasks.append(asyncio.create_task(coro))
        self.tasks.append(asyncio.create_task(self.report()))
        async def shutdown(event):
            self.unsubscribe_stop = None  # one-shot listener has already removed itself
            await self.stop()
        self.unsubscribe_stop = self.runtime.hass.bus.async_listen_once('homeassistant_stop', shutdown)

    @callback
    def state_changed(self, event):
        old, new = event.data.get('old_state'), event.data.get('new_state')
        if old is not None and new is not None and old.state == new.state:
            return
        for room in self.rooms.values():
            if event.data['entity_id'] in (room.config['switch'], room.config['mute']):
                room.reset()
                room.status_changed()

    def datagram_received(self, data, addr):
        if len(data) != 684 or data[:4] != b'LUN2':
            return
        room = self.rooms.get(struct.unpack_from('!I', data, 4)[0])
        if room and addr[0] == room.config['host']:
            room.receive(data)

    async def report(self):
        while True:
            async_dispatcher_send(self.runtime.hass,'luna_local_updated')
            await asyncio.sleep(1)

    async def stop(self):
        if getattr(self, 'playback', None) is not None:
            self.playback.close()
            self.runtime.hass.data['luna_local_avatar'].pop('playback', None)
        if self.transport:
            self.transport.close()
        if self.unsubscribe:
            self.unsubscribe()
        if self.unsubscribe_stop:
            self.unsubscribe_stop()
            self.unsubscribe_stop = None
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks,return_exceptions=True)
