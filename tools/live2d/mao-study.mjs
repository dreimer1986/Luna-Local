// Experimental mapping for the official Mao fixture. Does not select a live HA model.
export class MaoStudy {
  constructor() { this.values = {}; }
  sample(frame, dt) {
    const p = frame.parameters;
    const joy = Math.max(p.ParamLunaJoy || 0, p.ParamLunaLaugh || 0);
    const target = {
      ParamCheek: p.ParamLunaBlush || 0,
      ParamEyeLSmile: joy, ParamEyeRSmile: joy,
      ParamMouthUp: joy,
      ParamMouthDown: Math.max(p.ParamLunaSad || 0, p.ParamLunaConcern || 0),
      ParamMouthAngry: p.ParamLunaAnger || 0,
    };
    for (const vowel of ['A', 'I', 'U', 'E', 'O']) target[`Param${vowel}`] = p[`ParamLunaViseme${vowel}`] || 0;
    const ease = 1 - Math.exp(-Math.max(0, Math.min(.05, dt)) / .045);
    for (const [id, value] of Object.entries(target)) {
      this.values[id] = (this.values[id] || 0) + (value - (this.values[id] || 0)) * ease;
      if (/^Param[AIUEO]$/.test(id) && !p.ParamMouthOpenY) this.values[id] = 0;
    }
    return {...frame, parameters: {...p, ...this.values}};
  }
}
