import voluptuous as vol
from homeassistant import config_entries


class ConfigFlow(config_entries.ConfigFlow, domain="luna_local"):
    VERSION = 1

    async def async_step_reconfigure(self, user_input=None):
        entry = self._get_reconfigure_entry()
        if user_input is not None:
            return self.async_update_reload_and_abort(entry, data_updates=user_input)
        return self.async_show_form(step_id="reconfigure", data_schema=vol.Schema({
            vol.Required("agent_id", default=entry.data["agent_id"]): str,
            vol.Required("url", default=entry.data["url"]): str,
            vol.Required("model", default=entry.data["model"]): str,
        }))

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id("luna_local")
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Luna Lokal", data=user_input)
        return self.async_show_form(step_id="user", data_schema=vol.Schema({
            vol.Required("agent_id", default="conversation.ollama_conversation"): str,
            vol.Required("url", default="http://127.0.0.1:11434"): str,
            vol.Required("model", default="llama3.1:8b"): str,
        }))
