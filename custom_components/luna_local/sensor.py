from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.device_registry import async_get as device_registry, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from . import SIGNAL


async def async_setup_entry(hass, entry, async_add_entities):
    entities = [MemorySensor(entry)]
    if entry.runtime_data.continuous:
        entities.extend(AudioSensor(entry, room) for room in entry.runtime_data.continuous.rooms.values())
    async_add_entities(entities)


class MemorySensor(SensorEntity):
    _attr_name = "Luna gespeicherte Erinnerungen"
    _attr_icon = "mdi:brain"
    _attr_should_poll = False
    _attr_native_unit_of_measurement = "Erinnerungen"

    def __init__(self, entry):
        self.runtime = entry.runtime_data
        self._attr_unique_id = entry.entry_id + "_memory_count"

    @property
    def native_value(self):
        return self.runtime.count

    @property
    def extra_state_attributes(self):
        return {"warteschlange": self.runtime.queue.qsize(), "letzter_fehler": self.runtime.last_error,
                "ueberlast_verworfen": self.runtime.dropped, "speicher": "/config/luna_local_memory.sqlite3"}

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL, self.async_write_ha_state))


class AudioSensor(SensorEntity):
    _attr_should_poll = False
    _attr_icon = "mdi:microphone-message"

    def __init__(self, entry, room):
        self.room = room
        self._attr_unique_id = entry.entry_id + "_audio_" + str(room.config["stream_id"])
        self._attr_name = "Luna Audiostream " + room.config["name"]
        device = device_registry(entry.runtime_data.hass).async_get(room.config["device_id"])
        if device and (device.identifiers or device.connections):
            self._attr_device_info = DeviceInfo(identifiers=device.identifiers, connections=device.connections)

    @property
    def native_value(self):
        stats = self.room.stats()
        if not stats["aktiv"]:
            return "aus"
        if stats["letztes_paket_vor_s"] is None or stats["letztes_paket_vor_s"] > 2:
            return "kein Audiostream"
        if stats["audio_warteschlange"] > 3 or stats["text_warteschlange"] > 3:
            return "Verarbeitung im Rückstand"
        return {"listening": "hört zu", "processing": "verarbeitet",
                "responding": "bereitet Antwort vor", "error": "Fehler"}.get(stats["aktivitaet"], "empfängt")

    @property
    def extra_state_attributes(self):
        return self.room.stats()

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL, self.async_write_ha_state))
