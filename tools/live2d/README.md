# Local Cubism runtime development

The optional HA Live2D renderer now uses the real Luna portrait model locally.
It supports playback-driven mouth motion, blinking and subtle coherent idle
movement. This is an initial face rig, not the complete expression/outfit contract.
No SDK, Core, sample model or compiled runtime is committed to Git.

```powershell
cd tools/live2d
npm ci
npm run build -- C:\Users\dreimer\Downloads\Cubism\CubismSdkForWeb-5-r.5
```

The local output is `dist/runtime.mjs`, `dist/player.mjs`, `dist/Core/` and
`dist/Shaders/`. Keep those paths together. The bootstrap loads Core before the
Framework evaluates its enums. Models and textures must be served from the same
origin; dependencies must remain inside the model directory.

For the **SDK smoke test only**, add `--sample` after the SDK path in the build
command. This copies the SDK's `Samples/Resources/Hiyori` directory to `dist/Sample`
(ignored by Git). Then:

```powershell
node smoke.mjs
```

The test starts its own loopback HTTP server and an isolated headless Edge on
Windows. On Linux it uses Chromium (install locally with
`npx playwright-core install chromium`; required OS libraries must be available).
`LUNA_BROWSER_CHANNEL` overrides the default browser. It
loads an actual MOC3 through Core, renders pixels with software WebGL, checks
parameter IDs, captures `dist/smoke.png` and checks idempotent disposal. It does
not use a logged-in browser profile, microphone, HA or TTS. Inspect the screenshot
as well as the test result: nonzero pixels alone do not prove correct placement.

## Adapter interface

```javascript
const {mountLuna} = await import('./dist/runtime.mjs');
const player = await mountLuna(canvas, './model/luna.model3.json', {signal});
// Call from a single requestAnimationFrame loop. dt is seconds.
player.draw(dt, {
  group: 'Idle', expression: 'neutral', reducedMotion: false,
  parameters: {ParamMouthOpenY: 0},
});
player.dispose();
```

The caller owns animation scheduling, visibility, audio, turn cancellation and
canvas size. This module never plays audio embedded in sample motions. Expressions
use the model's authored expression files and Cubism fade handling; parameters are
explicit overrides. Unknown parameters are ignored. No random emotion selection,
no text-duration-based lip movement and no external CDN downloads are included.

## Luna portrait model and verification

The private `Luna-portrait-v1` package contains the CMO3, original export, source
layers and polished runtime model. Copy its `model` directory to `dist/Luna` to run:

```sh
node luna-smoke.mjs
```

The test checks actual mouth and blink pixel changes, idle geometry changes and
exact restoration when reduced motion is enabled. `tests/luna-audio-preview.html`
uses the real `LunaSession.playAudio` path and a local German test WAV. The WAV is
an optional private test asset, not a production voice dependency.

The model JSON must include `"LunaRig": {"Profile": "portrait-face-v1"}`. This
profile suppresses incompatible template face translations and applies coherent
idle movement to every mesh, including the original-art foreground. The effect
is a small 2D head tilt, breathing and weight shift; no 3D head turn or independent
hair physics is claimed. `portrait-motion.mjs` owns that profile's idle geometry.

Deploy runtime files under HA `www/luna/runtime` and the model under
`www/luna/model`. Set the existing card to `avatar: live2d`. The runtime and model
remain local to HA. Mouth timing follows Web Audio; spectral shape estimation is
an approximation, not phoneme-aligned MotionSync. The separate MotionSync SDK has
been downloaded privately but is not integrated.

Still outstanding: richer authored expressions, independent hair/body rigging,
phonetic calibration, physical microphone validation and publication/license
review before distributing the private template-derived model or Cubism runtime.
