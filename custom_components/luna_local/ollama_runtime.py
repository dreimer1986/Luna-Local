"""Model residency and timing helpers; no changes to prompts or GPU selection."""
import asyncio
import logging

import aiohttp

DEFAULT_MODEL = "qwen3:4b-instruct"
KEEP_ALIVE = -1
LOGGER = logging.getLogger(__name__)


async def preload_model(session, url, model):
    """Warm up in a cancellable background task, tolerating late add-on startup.

    Do not replace an already loaded runner (which may use a larger context).
    This only loads an installed model; it never downloads one.
    """
    base = url.rstrip("/")
    for attempt in range(3):
        try:
            async with session.get(base + "/api/ps", timeout=aiohttp.ClientTimeout(total=15)) as response:
                response.raise_for_status()
                loaded = await response.json()
            if any(item.get("model", item.get("name")) == model for item in loaded.get("models", [])):
                return
            async with session.post(
                base + "/api/generate",
                json={"model": model, "stream": False, "keep_alive": KEEP_ALIVE,
                      "options": {"num_ctx": 4096}},
                timeout=aiohttp.ClientTimeout(total=120),
            ) as response:
                response.raise_for_status()
                result = await response.json()
                if result.get("error"):
                    raise ValueError("Ollama rejected model preload")
            return
        except (aiohttp.ClientError, TimeoutError, ValueError):
            if attempt == 2:
                LOGGER.warning("Could not preload local model %s; the next request will retry loading it", model)
                return
            await asyncio.sleep(10 * (attempt + 1))


def inference_timings(result):
    """Expose Ollama's nanosecond timings without retaining conversation text."""
    timings = {}
    for key in ("load", "prompt_eval", "eval"):
        duration = result.get(key + "_duration")
        if isinstance(duration, (int, float)) and duration >= 0:
            timings[key + "_seconds"] = round(duration / 1_000_000_000, 3)
    count, duration = result.get("eval_count"), result.get("eval_duration")
    if isinstance(count, (int, float)) and isinstance(duration, (int, float)) and duration > 0:
        timings["tokens_per_second"] = round(count * 1_000_000_000 / duration, 2)
    return timings
