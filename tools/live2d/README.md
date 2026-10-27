# Local Cubism runtime development

This is a **development adapter**, not a completed Luna avatar or an installed HA
renderer. It uses the official Web Framework and Core from the SDK supplied by the
user. No SDK, Core, sample model or compiled runtime is committed to Git.

```powershell
cd tools/live2d
npm ci
npm run build -- C:\Users\dreimer\Downloads\Cubism\CubismSdkForWeb-5-r.5
```

The local output is `dist/runtime.mjs`, `dist/player.mjs`, `dist/Core/` and
`dist/Shaders/`. Keep those paths together. The bootstrap loads Core before the
Framework evaluates its enums. Models and textures must be served from the same
origin; dependencies must remain inside the model directory.

For the **SDK smoke test only**, copy the SDK's `Samples/Resources/Hiyori` directory
to `dist/Sample` (the contents of `Sample` must include `Hiyori.model3.json`). Then:

```powershell
node smoke.mjs
```

The test starts its own loopback HTTP server and an isolated headless Edge. It
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

## Still required

- Rigged Luna, separated artwork, mouth forms and authored expressions/motions.
- MotionSync Core/plugin and calibrated German speech mappings. The ordinary Web
  SDK supplied here does **not** include that separate plugin. This adapter does
  not claim audio-derived lip synchronization.
- Final layering/priority between body motion, blinking, expressions and phonemes
  with Luna's actual rig, followed by visual transition QA.
- HA card/popup integration, graceful fallback and cancellation tests with real
  browser speech. The production card is intentionally unchanged at this stage.
- Real-device performance, multiple renderers and context-restoration tests.
- Publication/license review before distributing a built runtime through HACS.

Tested locally on 2026-10-27 with the supplied Cubism Web SDK 5 R5, Node 24 and
headless Microsoft Edge. This is a rendering/lifecycle check, not a claim that the
requested expressive Luna model is finished.
