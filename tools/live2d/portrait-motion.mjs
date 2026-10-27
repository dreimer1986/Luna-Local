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
    const side = x < 0 ? -1 : 1;
    const hand = smooth(.28, .38, Math.abs(x)) * smooth(.53, .64, -y);
    const angle = .018 * Math.sin(time * .63 + (side > 0 ? 2.1 : 0)) * hand;
    const wx = x - side * .37, wy = y + .58;
    const handX = wx * Math.cos(angle) - wy * Math.sin(angle) - wx;
    const handY = wx * Math.sin(angle) + wy * Math.cos(angle) - wy;
    let fingerX = 0, fingerY = 0;
    if (hand > 0) {
      const px = side < 0 ? 512 + x * 1024 : 512 - x * 1024;
      const py = 768 - y * 1024;
      const tips = [[99,1529],[131,1515],[138,1495],[136,1471],[107,1490]];
      tips.forEach(([tx,ty], n) => {
        const influence = Math.exp(-(((px-tx)/13)**2+((py-ty)/20)**2));
        const flex = (1 + Math.sin(time * .57 + n * .73 + (side > 0 ? 1.8 : 0))) / 2;
        fingerX += side * influence * flex * .0008;
        fingerY += influence * flex * .0022;
      });
    }
    vertices[i] = handX + fingerX + x + head * (hx * c - hy * s - hx) + sway * body + x * chest * breath * .003;
    vertices[i + 1] = handY + fingerY + y + head * (hx * s + hy * c - hy) + body * breath * .0018;
  }
}
