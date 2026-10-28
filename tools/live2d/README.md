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

### Private Mao full-body study

The experimental page uses the **unmodified official Mao sample**, not a finished
Luna redesign. Copy it from your own SDK and run the local preview:

```powershell
node build.mjs C:\Users\dreimer\Downloads\Cubism\CubismSdkForWeb-5-r.5 --mao-sample
node mao-preview.mjs
```

Open <http://127.0.0.1:8791/tests/mao-study.html>. Stop the server with Ctrl+C.
The page fits the entire model including feet, offers zoom/vertical position,
all eight original motions, and a separate simulated Luna-controls mode.
The latter maps Luna's five vowel controls to Mao's `ParamA/I/U/E/O` and maps
blush, smile and mouth expressions. It has no microphone, audio output or HA
connection. The vowel loop is only an explicit visual diagnostic, not speech sync.
Motion and emotion controls apply to their respective modes.

`node mao-preview.mjs --check` renders three aspect ratios, checks visible margins,
five vowel changes, four expression changes, mouth closure on interruption and
all eight motion selections. Screenshots are under ignored `dist/mao-check/`.
These checks prove rendering/control compatibility, not artistic correctness of
a transferred Luna rig. Source files, sample textures and compiled Core stay private.

The download's `ReadMe.txt` identifies Mao as a **PRO model**. Cubism FREE cannot
save/export such a model; a working PRO-capable editor is needed for the full rig
transfer. The original model's motions/effects do not all suit Luna automatically.
Keep Luna's approved identity, age-appropriate clothing and her own artwork; do
not ship Mao's costume or magical props as a substitute. See
[Mao study handoff](../../docs/live2d/mao-study.md).

Private authoring studies now include a calf transfer and an eleven-part body
transfer, saved as CMO3. Generate the revised body PSD from the repository root:

```sh
python tools/separate_luna_body.py --mao-body --output /path/to/new/body-study
```

Requires Pillow, numpy and psd-tools. The script verifies exact neutral pixels
and PSD round-trip, refuses existing output folders, and leaves the head as an
unrigged reference. This is material preparation, not automated finished rigging.
The transferred shoulder pivots and joint overlaps still need authoring work;
see the handoff for the duplicate `Forearm R` mapping trap and saved private paths.

### Runtime calls

```javascript
const {mountLuna} = await import('./dist/runtime.mjs');
const player = await mountLuna(canvas, './model/luna.model3.json', {signal});
// Call from a single requestAnimationFrame loop. dt is seconds.
player.draw(dt, {
  group: 'Idle', expression: 'neutral', reducedMotion: false,
  parameters: {ParamMouthOpenY: 0},
  motionIndex: 0, // optional index within the selected motion group
  view: {zoom: 1, x: 0, y: 0}, // optional; positive y moves down
});
player.dispose();
```

The default view remains a full-canvas fit. Zoom is bounded to 0.5–3; offsets
are fractions of viewport size, bounded to -1–1. These are runtime arguments;
the production HA card does not yet expose them as YAML options.

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

The portrait profile also adds small asynchronous wrist and fingertip movements.
`portrait-mesh.mjs` refines the two illustration meshes with shared midpoints and
interpolated UVs; each frame is recomputed from Core geometry to prevent drift.
This is idle relaxation, not a waving animation. Reduced motion disables it.
