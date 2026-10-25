"""Explicitly gated native Assist control, using HA's exposed entities/intents."""
import re

from homeassistant.components import conversation
from homeassistant.core import Context
from homeassistant.helpers import intent

OFF = 'Aus'
ADDRESSED = 'Nur mit Luna'
ALWAYS = 'Ohne Namensansprache'
MODES = [OFF, ADDRESSED, ALWAYS]


def permitted_text(text, mode, explicit_assist=False):
    """A mention in a movie/dialogue is not a direct address at sentence start."""
    if mode not in MODES or mode == OFF:
        return None
    match = re.match(r'^\s*(?:(?:hey|hallo|okay|ok)\s+)?luna\b[\s,:!.-]*', text, re.I)
    if mode == ADDRESSED and not (match or explicit_assist):
        return None
    return (text[match.end():] if match else text).strip() or None


async def async_control(hass, text, device_id, satellite_id, allowed, language='de', context=None):
    """Recognize without executing, then re-check permission before dispatch."""
    agent = conversation.async_get_agent(hass, conversation.HOME_ASSISTANT_AGENT)
    if agent is None or not hasattr(agent, 'async_recognize_intent'):
        return None
    context = context or Context()
    user_input = conversation.ConversationInput(
        text=text, context=context, conversation_id=None, device_id=device_id,
        satellite_id=satellite_id, language=language, agent_id=conversation.HOME_ASSISTANT_AGENT,
    )
    result = await agent.async_recognize_intent(user_input)
    if result is None or not allowed():
        return None
    # Recognition alone never toggles devices. Execution remains in native HA,
    # including entity exposure, area resolution and Music Assistant intents.
    response = await conversation.async_converse(
        hass, text, None, context, language=language,
        agent_id=conversation.HOME_ASSISTANT_AGENT,
        device_id=device_id, satellite_id=satellite_id,
    )
    speech = response.response.speech.get('plain', {}).get('speech', '')
    if not speech:
        speech = ('Der Befehl konnte nicht ausgeführt werden.'
                  if response.response.response_type == intent.IntentResponseType.ERROR
                  else 'Erledigt.')
    return speech
