"""Avatar transport contracts without requiring a running HA installation."""
import asyncio
import importlib.util
import json
from pathlib import Path
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import AsyncMock, Mock, patch

import probatio as vol


def command(schema):
    def decorate(function):
        function.schema = vol.Schema({vol.Required("id"): int}).extend(schema)
        return function
    return decorate


root = Path(__file__).parents[1] / "custom_components/luna_local"
package = ModuleType("avatar_test_package")
package.__path__ = [str(root)]
stubs = {
    "avatar_test_package": package,
    "homeassistant": ModuleType("homeassistant"),
    "homeassistant.components": ModuleType("homeassistant.components"),
    "homeassistant.components.frontend": SimpleNamespace(add_extra_js_url=Mock()),
    "homeassistant.components.websocket_api": SimpleNamespace(
        websocket_command=command, async_response=lambda function: function,
        async_register_command=Mock()),
    "homeassistant.components.http": SimpleNamespace(StaticPathConfig=lambda *args: args),
    "homeassistant.core": SimpleNamespace(callback=lambda function: function),
    "homeassistant.helpers": ModuleType("homeassistant.helpers"),
    "homeassistant.helpers.entity_registry": SimpleNamespace(async_get=Mock()),
    "homeassistant.helpers.aiohttp_client": SimpleNamespace(async_get_clientsession=Mock()),
    "homeassistant.loader": SimpleNamespace(async_get_integration=AsyncMock(
        return_value=SimpleNamespace(version="0.4.0b2"))),
}
with patch.dict(sys.modules, stubs):
    spec = importlib.util.spec_from_file_location("avatar_test_package.avatar", root / "avatar.py")
    avatar = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(avatar)


class AvatarTests(unittest.IsolatedAsyncioTestCase):
    def fixture(self, content):
        response = SimpleNamespace(raise_for_status=Mock(), json=AsyncMock(return_value={
            "message": {"content": json.dumps(content)}}))
        manager = AsyncMock()
        manager.__aenter__.return_value = response
        client = SimpleNamespace(post=Mock(return_value=manager))
        hass = SimpleNamespace(data={
            "luna_local": SimpleNamespace(entry=SimpleNamespace(data={"url": "http://ollama:11434", "model": "local"})),
            "luna_local_avatar": {"expression_lock": asyncio.Lock()},
        })
        return hass, SimpleNamespace(send_result=Mock()), client

    async def test_expression_uses_local_model_and_replies_only_to_requester(self):
        hass, connection, client = self.fixture({"name": "shy", "intensity": .6})
        with patch.object(avatar, "async_get_clientsession", return_value=client):
            await avatar.avatar_expression(hass, connection, {"id": 12, "text": "Hallo", "reply": "Hallo!"})
        connection.send_result.assert_called_once_with(12, {"name": "shy", "intensity": .6})
        self.assertEqual(client.post.call_args.args[0], "http://ollama:11434/api/chat")
        self.assertEqual(client.post.call_args.kwargs["json"]["keep_alive"], -1)

    async def test_invalid_metadata_falls_back_to_neutral(self):
        for content in ([], {}, {"name": "unknown", "intensity": .5},
                        {"name": "shy", "intensity": True}, {"name": "shy", "intensity": float("nan")}):
            with self.subTest(content=content):
                hass, connection, client = self.fixture(content)
                with patch.object(avatar, "async_get_clientsession", return_value=client):
                    await avatar.avatar_expression(hass, connection, {"id": 1, "text": "", "reply": ""})
                connection.send_result.assert_called_once_with(1, avatar.NEUTRAL)

    async def test_busy_classifier_does_not_queue_another_request(self):
        hass, connection, client = self.fixture({})
        async with hass.data["luna_local_avatar"]["expression_lock"]:
            with patch.object(avatar, "async_get_clientsession", return_value=client):
                await avatar.avatar_expression(hass, connection, {"id": 1, "text": "", "reply": ""})
        client.post.assert_not_called()
        connection.send_result.assert_called_once_with(1, avatar.NEUTRAL)

    async def test_model_timeout_keeps_speech_metadata_optional(self):
        hass, connection, client = self.fixture({})
        client.post.side_effect = TimeoutError
        with patch.object(avatar, "async_get_clientsession", return_value=client):
            await avatar.avatar_expression(hass, connection, {"id": 1, "text": "", "reply": ""})
        connection.send_result.assert_called_once_with(1, avatar.NEUTRAL)
        self.assertFalse(hass.data["luna_local_avatar"]["expression_lock"].locked())

    async def test_static_registration_is_idempotent_and_scoped_to_frontend(self):
        hass = SimpleNamespace(data={}, http=SimpleNamespace(async_register_static_paths=AsyncMock()))
        avatar.frontend.add_extra_js_url.reset_mock()
        await avatar.async_setup_avatar(hass)
        await avatar.async_setup_avatar(hass)
        hass.http.async_register_static_paths.assert_awaited_once()
        config = hass.http.async_register_static_paths.call_args.args[0][0]
        self.assertEqual(config, ("/luna-local", str(root / "frontend"), False))
        avatar.frontend.add_extra_js_url.assert_called_once_with(
            hass, "/luna-local/luna-avatar-card.js?v=0.4.0b2")

    def test_websocket_schema_rejects_oversized_or_missing_messages(self):
        schema = avatar.avatar_expression.schema
        schema({"id": 1, "type": "luna_local/avatar/expression", "text": "x", "reply": "y"})
        for text, reply in (("x" * 2001, ""), ("", "y" * 3001), (None, "")):
            with self.assertRaises(vol.Invalid):
                schema({"id": 1, "type": "luna_local/avatar/expression", "text": text, "reply": reply})
