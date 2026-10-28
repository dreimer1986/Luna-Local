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

**No template transfer or adapted CMO3 has been completed.** Both available native
app interfaces failed with `Computer Use native pipe is unavailable ... os error 2`,
including a helper-session reset. Restore app control before editor work. This is
an unavailable automation connection, not evidence that the desktop is locked.
The package is PRO; the last known installed editor is FREE. According to the
official sample page, FREE can inspect but cannot save/export a PRO model.
No trial or subscription has been activated.

Next: obtain a working PRO-capable editor, import/separate Luna's full-body art,
then apply Mao's template on a copy with manual part/deformer correspondence.
Keep ears, hair, sweater, hands, trousers and shoes separate; redraw occluded
areas before deforming. Check head turns, closed eyes, mouth corners, overlapping
limbs, sleeve cuffs, hips/knees/ankles and edge cropping through every keyform.
Map only suitable gestures, remove sample-specific props/effects and verify all
five vowels at several head angles. Render and visually approve before replacing
the current portrait model. Pixel-change tests alone are not acceptance criteria.

Official references:

- [Mao source and FREE/PRO note](https://www.live2d.com/en/learn/sample/niziiro-mao/)
- [Applying model templates](https://docs.live2d.com/en/cubism-editor-manual/applying-the-model-template/)
- [Sample terms](https://www.live2d.com/en/learn/sample/model-terms/)
- [Free Material License Agreement](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html)

Private originals and derivative authoring studies stay outside the public repo.
The browser study displays the sample attribution. No bundled sample audio is used.
