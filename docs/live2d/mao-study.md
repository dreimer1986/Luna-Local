# Mao template test — 28 October 2026

User direction: use Niziiro Mao as a test template, retain the approved Luna
identity, and include full legs/feet. Full body is the source; crop/zoom is a view
choice. All clothing remains age-appropriate and SFW.

## Verified here

- The SDK Mao model runs in Luna's existing Cubism adapter: 132 parameters,
  eight expressions, two Idle and six TapBody motions.
- Added local `tests/mao-study.html`, `tools/live2d/mao-study.mjs` and preview/check
  runner. Original sample and diagnostic Luna controls are explicitly separated.
- Five vowels, laughter, shyness, anger and sadness change rendered pixels.
  Interruption closes the vowel controls. Visual inspection confirms feet and
  head fit in landscape and phone views; portrait bounds are also checked.
- Existing SDK/session smoke checks pass, including playback-clock mouth,
  interruption, renderer fallback, context loss and disposal.
- No production model, HA resource or live dashboard changed.

## Authoring material and remaining work

New full-body artwork study: `docs/live2d/references/luna-fullbody-study-v1.png`.
The adjacent `.prompt.md` records the exact built-in imagegen edit prompt and
limitations. It extends the approved waist reference with long dark trousers and
flat shoes and has an alpha channel; it is not yet a separated model source or user-approved
replacement. The approved original stays unchanged.

The user downloaded `C:\Users\dreimer\Downloads\Cubism\mao_en.zip`.
Original extracted source:
`C:\Users\dreimer\Downloads\Cubism\Mao-test\original\mao_pro_t06.cmo3`.
Keep the original and its ReadMe intact. Work on the sibling `working` copy.
The archive also includes animation source `.can3` and a 4096-texture runtime;
the automated browser study currently uses the SDK's 2048-texture runtime.

**Partial body transfers are saved; no finished avatar/runtime export exists.** Native app control
was restored after the user's restart/retry on 28 October. The working Mao CMO3
was opened successfully in Cubism and exported through Modeling > Model Template
as `Mao - private Luna rig study`, with Live2D Inc. credited as original author.
The export contains CMO3, JSON metadata and thumbnail, installed in
`%APPDATA%/Live2D/Cubism5.3_Editor/template_local/Mao - private Luna rig study/`.
A portable private copy is in `Downloads/Cubism/Mao-test/template/`.
The package is PRO. The user has now activated the PRO trial. The running editor's
window title confirms `Trial version 43 days remaining` (28 October 2026).
Both the license prerequisite and native app connection are now resolved;
the successful template export also verifies writing from the PRO editor.

The first body separation is reproducible with `tools/separate_luna_body.py`
(Pillow, numpy, psd-tools), using `--output` with a new directory. It writes 14
cropped PSD layers with original offsets, PNGs, contour diagnostics and a manifest.
Exact neutral reconstruction and pixel equality after reopening the PSD pass.
Existing output folders are refused.

The draft is in `Downloads/Cubism/Mao-test/luna-body-v2/`.
`luna-body-separated.psd` was imported and saved as `luna-body-separated.cmo3`.
It remains unrigged: head/hair/ears are combined, joints lack hidden overlaps,
and thin knee seams are visible in the editor.

A partial template preview on `calf_viewer_L` initially auto-mapped incorrectly.
This was corrected to `Leg R`, checked with body X/Z movement, applied and saved
as `luna-body-v2/luna-mao-calf-test.cmo3` (1,823,351 bytes). The initial unrigged
CMO3 was preserved.

### Completed body-transfer experiment

`--mao-body` combines each thigh/calf pair into one leg, removing artificial knee
seams. It uses anatomical Mao layer names (viewer-left = anatomical right).
The resulting twelve-layer PSD includes eleven body parts and `Luna Head Reference`.
Both neutral reconstruction and reopened PSD pixels were checked exactly.

Private files under `Downloads/Cubism/Mao-test/`:

- `luna-body-v3/luna-mao-body-test.cmo3`: first whole-body transfer, 1,727,265 bytes.
- `luna-body-v4/luna-body-separated.psd`: revised inner sleeve contours.
- `luna-body-v4/luna-mao-body-v4.cmo3`: saved transfer with revised sleeves.

Import as a new model with pre-5.3 blend mode, lock the head reference, select
the eleven body parts, then apply the local Mao template. Exact names largely
match, but **Forearm R incorrectly maps to Arm R A**, while the other right-arm
parts use B. In Preview > Mapping List, edit Forearm R and select the **last**
Forearm R near the end of the list (between Hand R and Sleeve R Back). Press
Enter to commit the cell, then Mapping List OK. The unwanted Arm R A parameter
group disappears. Reusing previous application settings did not retain this
manual correction in the next new model; check it every time.

V3 and V4 were checked at both extremes of Arm R B shoulder rotation. V4 fixes
the long thin sleeve strip caused by cutting along the outside of the arm.
It still fails visual acceptance: the shoulder pivot is too low and the upper
arm separates from the shoulder at one extreme. A small detached cloth fragment
remains near the cuff at the other extreme. Hidden joint overlap artwork is
absent. The head remains a static locked reference outside the body hierarchy.
Do not deploy this study or describe it as finished facial/body animation.

Observed problem deformer: `Upper Arm L B Rotation` (`Rotation18`) in the V4 model.
Its pivot is visibly around the middle of the upper arm, below Luna's shoulder.
The official correction uses Ctrl+drag to move the deformer without its children.
The available desktop `sky.drag` API has no modifier-key argument and `press_key`
only sends completed chords; do not substitute an ordinary drag. This is an
authoring-control limitation, not a license or authentication issue.

Mixed-DPI redraw artifacts after display changes can be resolved by reopening
the affected dialog. A transient `no monitor found for window` this session was
resolved by reselecting the returned Cubism window. Desktop access subsequently
worked; no Windows security or lock settings were changed.

Next: correct shoulder/elbow/wrist pivot positions on a copy and validate their
keyforms, then build separated facial/hair artwork and corresponding deformers.
Keep ears, hair, sweater, hands, trousers and shoes separate; redraw occluded
areas before deforming. Check head turns, closed eyes, mouth corners, overlapping
limbs, sleeve cuffs, hips/knees/ankles and edge cropping through every keyform.
Map only suitable gestures, remove sample-specific props/effects and verify all
five vowels at several head angles. Render and visually approve before replacing
the current portrait model. Pixel-change tests alone are not acceptance criteria.

### Combined material checkpoint, 28 October

`luna-fullbody-face-v1` separates the full-body source into 14 visible facial/base
layers plus one hidden skin-repair draft. The repair has visible remnants and is
not accepted for motion. `luna-combined-v1/luna-fullbody-face-separated.psd`
combines its 13 facial patches with the body and remaining head into 25 layers.
Reconstruction and per-layer PSD round-trip preserve all visible source pixels.
Cubism successfully imported the PSD as a separate model, saved privately as
`luna-combined-v1/luna-fullbody-face-separated.cmo3` (1,785,370 bytes).
This is unrigged material; V4's transferred body animation remains in V4.
No hidden repairs are included in the combined model. Hair/ears are still combined,
irises contain only their visible portions and the mouth has no interior.

The default portrait separator also passed the same pixel checks after adding
custom source/region arguments. Reproduce with the commands in the tools README.
Transport these additions in `Downloads/Luna-face-materials-2026-10-28.zip`;
the earlier Mao authoring ZIP has not been overwritten.

Official references:

- [Mao source and FREE/PRO note](https://www.live2d.com/en/learn/sample/niziiro-mao/)
- [Applying model templates](https://docs.live2d.com/en/cubism-editor-manual/applying-the-model-template/)
- [Rotation deformer positioning](https://docs.live2d.com/en/cubism-editor-manual/making-and-rotation-of-rotationdeformer/)
- [PSD re-import and mesh changes](https://docs.live2d.com/4.2/en/cubism-editor-manual/psd-re-import/)
- [Sample terms](https://www.live2d.com/en/learn/sample/model-terms/)
- [Free Material License Agreement](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html)

Private originals and derivative authoring studies stay outside the public repo.
The browser study displays the sample attribution. No bundled sample audio is used.
