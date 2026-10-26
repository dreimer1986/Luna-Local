import asyncio
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch

import aiohttp

spec = importlib.util.spec_from_file_location(
    "ollama_runtime", Path(__file__).parents[1] / "custom_components/luna_local/ollama_runtime.py"
)
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


class Response:
    def __init__(self, data):
        self.data = data

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    def raise_for_status(self):
        pass

    async def json(self):
        return self.data


class Session:
    def __init__(self, models=()):
        self.models = models
        self.posts = []

    def get(self, *args, **kwargs):
        return Response({"models": self.models})

    def post(self, url, **kwargs):
        self.posts.append((url, kwargs))
        return Response({"done": True})


class PreloadTests(unittest.IsolatedAsyncioTestCase):
    async def test_cold_start_loads_without_generating_or_forcing_a_device(self):
        session = Session()
        await runtime.preload_model(session, "http://ollama:11434/", "test:4b")
        self.assertEqual(len(session.posts), 1)
        url, options = session.posts[0]
        self.assertEqual(url, "http://ollama:11434/api/generate")
        body = options["json"]
        self.assertEqual(body["model"], "test:4b")
        self.assertEqual(body["keep_alive"], -1)
        self.assertNotIn("prompt", body)
        self.assertNotIn("num_gpu", body["options"])

    async def test_does_not_replace_loaded_runner_with_larger_context(self):
        session = Session([{"model": "test:4b", "context_length": 8192}])
        await runtime.preload_model(session, "http://ollama", "test:4b")
        self.assertEqual(session.posts, [])

    async def test_retries_late_server_but_stops_after_three_attempts(self):
        session = Session()
        with patch.object(session, "get", side_effect=aiohttp.ClientConnectionError) as get:
            with patch.object(runtime.asyncio, "sleep", new_callable=AsyncMock) as sleep:
                with self.assertLogs(runtime.LOGGER, level="WARNING"):
                    await runtime.preload_model(session, "http://ollama", "test:4b")
        self.assertEqual(get.call_count, 3)
        self.assertEqual([call.args[0] for call in sleep.await_args_list], [10, 20])

    async def test_recovers_after_initial_failure(self):
        session = Session()
        with patch.object(session, "get", side_effect=[aiohttp.ClientConnectionError(), Response({"models": []})]):
            with patch.object(runtime.asyncio, "sleep", new_callable=AsyncMock):
                await runtime.preload_model(session, "http://ollama", "test:4b")
        self.assertEqual(len(session.posts), 1)

    async def test_unload_cancellation_is_not_swallowed(self):
        session = Session()
        with patch.object(session, "get", side_effect=asyncio.CancelledError):
            with self.assertRaises(asyncio.CancelledError):
                await runtime.preload_model(session, "http://ollama", "test:4b")


class TimingTests(unittest.TestCase):
    def test_missing_or_zero_durations_are_safe(self):
        self.assertEqual(runtime.inference_timings({}), {})
        self.assertEqual(runtime.inference_timings({"eval_duration": 0, "eval_count": 0}), {"eval_seconds": 0})

    def test_separates_cold_load_from_generation_without_text(self):
        self.assertEqual(runtime.inference_timings({
            "load_duration": 3_000_000_000, "prompt_eval_duration": 2_000_000_000,
            "eval_duration": 10_000_000_000, "eval_count": 50, "message": {"content": "private"},
        }), {"load_seconds": 3, "prompt_eval_seconds": 2, "eval_seconds": 10, "tokens_per_second": 5})
