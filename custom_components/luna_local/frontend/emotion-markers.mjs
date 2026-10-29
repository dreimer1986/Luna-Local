// Explicit reply markers only: do not infer feelings from the user's words.
const GROUPS = [
  ['laughing', /[😂🤣😆😹]|(?:^|\s)(?:[xX]D|:-?D)(?=$|\s|[.!?])/u, .65],
  ['sad', /[😢😭😞😔😿]|(?:^|\s):-?\((?=$|\s|[.!?])/u, .55],
  ['angry', /[😠😡🤬😾😤]/u, .45],
  ['surprised', /[😮😲😯]/u, .5],
  ['thoughtful', /[🤔🧐]/u, .4],
  ['shy', /[☺😊🙈😳😅]/u, .4],
  ['joyful', /[😀😃😄😁🙂😍🥰😺😸❤♥]|(?:^|\s)[:;]-?\)(?=$|\s|[.!?])/u, .5],
];
export function markerExpression(value) {
  const text = Array.isArray(value) ? value.filter(x => typeof x === 'string').join(' ') : typeof value === 'string' ? value : '';
  const gesture = /👋/u.test(text) ? 'wave' : /[😡😤]/u.test(text) ? 'hips' : /😠/u.test(text) ? 'crossed' : null;
  for (const [name, pattern, intensity] of GROUPS) if (pattern.test(text)) return {name, intensity, ...(gesture?{gesture}:{})};
  if(gesture)return {name:'joyful',intensity:.5,gesture};
  return null;
}
