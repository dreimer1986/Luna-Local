// Small coherent movements for Luna's first portrait rig. Apply to every mesh,
// including the original foreground, so facial apertures stay aligned.
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function movePortrait(vertices, time, reducedMotion = false) {
  if (reducedMotion) return;
  const breath = Math.sin(time * 1.35);
  const sway = .004 * Math.sin(time * .43) + .0015 * Math.sin(time * .71);
  const tilt = .012 * Math.sin(time * .53) + .004 * Math.sin(time * .31);
  const c = Math.cos(tilt), s = Math.sin(tilt);
  for (let i = 0; i < vertices.length; i += 2) {
    const x = vertices[i], y = vertices[i + 1];
    const head = smooth(.12, .28, y), body = smooth(-.72, .15, y);
    const hx = x - .02, hy = y - .23;
    const chest = smooth(-.5, -.1, y) * (1 - smooth(.12, .28, y));
    vertices[i] = x + head * (hx * c - hy * s - hx) + sway * body + x * chest * breath * .003;
    vertices[i + 1] = y + head * (hx * s + hy * c - hy) + body * breath * .0018;
  }
}
