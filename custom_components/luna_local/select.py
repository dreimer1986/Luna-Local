"""Per-room permission for commands heard in the continuous audio stream."""
from homeassistant.components.select import SelectEntity
from homeassistant.helpers.device_registry import DeviceInfo, async_get
from homeassistant.helpers.restore_state import RestoreEntity
from .control import ADDRESSED, MODES


async def async_setup_entry(hass, entry, async_add_entities):
    if entry.runtime_data.continuous:
        async_add_entities(ControlMode(entry, room) for room in entry.runtime_data.continuous.rooms.values())


class ControlMode(SelectEntity, RestoreEntity):
    _attr_should_poll = False
    _attr_icon = 'mdi:home-lock'
    _attr_options = MODES

    def __init__(self, entry, room):
        self.room = room
        self._attr_unique_id = entry.entry_id + '_control_' + str(room.config['stream_id'])
        self._attr_name = 'Luna Haussteuerung ' + room.config['name']
        device = async_get(entry.runtime_data.hass).async_get(room.config['device_id'])
        if device and (device.identifiers or device.connections):
            self._attr_device_info = DeviceInfo(identifiers=device.identifiers, connections=device.connections)

    @property
    def current_option(self):
        return self.room.control_mode

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        previous = await self.async_get_last_state()
        self.room.control_mode = previous.state if previous and previous.state in MODES else ADDRESSED

    async def async_select_option(self, option):
        if option not in MODES:
            raise ValueError('Unknown control mode')
        self.room.control_mode = option
        # Drop queued/in-flight old permission context. Changing permission must
        # not execute an already buffered movie line under the new mode.
        self.room.reset()
        self.async_write_ha_state()
        self.room.status_changed()
