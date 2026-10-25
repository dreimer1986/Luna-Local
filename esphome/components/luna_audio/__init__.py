import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import microphone, esp32
from esphome.const import CONF_ID, CONF_MICROPHONE
DEPENDENCIES = ['esp32', 'microphone', 'network']
AUTO_LOAD = ['socket']
ns = cg.esphome_ns.namespace('luna_audio')
LunaAudio = ns.class_('LunaAudio', cg.Component)
CONFIG_SCHEMA = cv.Schema({
    cv.GenerateID(): cv.declare_id(LunaAudio),
    cv.Required(CONF_MICROPHONE): microphone.microphone_source_schema(),
    cv.Required('host'): cv.ipv4address,
    cv.Optional('port', default=12101): cv.port,
    cv.Required('stream_id'): cv.int_range(min=1, max=0xffffffff),
    cv.Required('key'): cv.All(cv.string_strict, cv.Length(min=64, max=64)),
}).extend(cv.COMPONENT_SCHEMA)
def _reserve_socket(config):
    from esphome.components import socket
    socket.consume_sockets(1, 'luna_audio', socket.SocketType.UDP)(config)
    return config

CONFIG_SCHEMA = cv.All(CONFIG_SCHEMA, _reserve_socket)
FINAL_VALIDATE_SCHEMA = cv.Schema({cv.Required(CONF_MICROPHONE): microphone.final_validate_microphone_source_schema('luna_audio', sample_rate=16000)}, extra=cv.ALLOW_EXTRA)
async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    mic = await microphone.microphone_source_to_code(config[CONF_MICROPHONE])
    cg.add(var.set_microphone(mic))
    cg.add(var.set_host(str(config['host'])))
    cg.add(var.set_port(config['port']))
    cg.add(var.set_stream_id(config['stream_id']))
    try:
        key = bytes.fromhex(config['key'])
        if len(key) != 32: raise ValueError()
    except ValueError:
        raise cv.Invalid('key must contain exactly 32 bytes in hex')
    cg.add(var.set_key(list(key)))
    esp32.add_idf_sdkconfig_option('CONFIG_MBEDTLS_GCM_C', True)
