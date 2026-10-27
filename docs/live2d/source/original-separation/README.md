# Pixel-preserving face separation

Prepared locally on 2026-10-27 from the approved `luna-waist-reference.png`.
No image generation, scaling, repositioning or recolouring is used for the visible
layers. This is the current material-authoring starting point; the earlier
generated `luna-face-study.cmo3` is superseded for this purpose.

## Files

- `luna-face-separated.psd`: 14 visible layers, plus one hidden repair draft.
- `../luna-face-separated.cmo3`: PSD imported into Cubism 5.3.05 beta1 FREE under
  Wine, saved with successful archive verification, and reopened from the repo.
- `layers/`: registered RGBA PNGs on the original 1024 x 1536 canvas.
- `neutral-reassembled.png`: reconstruction from the visible source layers.
- `face-review.png`: original/reconstruction, contour map and hidden repair draft.
- `manifest.json`: source/contour hashes and pixel validation results.
- `../face-separation-regions.json`: editable source-coordinate contours.

Each eye has separate upper/lower lid-and-skin patches, visible sclera,
iris/pupil and principal highlight. The two brows and closed mouth are separate.
L/R names refer to the **viewer's** sides, not yet to Cubism anatomical parameter
names. Hair, ears, clothing and body remain together in the base layer.

## Verified

- **Zero changed visible RGB pixels** when reassembling the visible layers.
- **Zero changed alpha pixels**, including the original slightly translucent face.
- All visible PSD layer pixel arrays survive saving and reopening exactly.
- Original source and reference CMO3 are unchanged.
- Cubism imports and displays the separated original face under Wine.

The PSD source-layer result is pixel-exact; the editor screenshot is a visual
rendering check, not a claim that GPU-resampled output matches source bytes.

## Still unfinished

There are no authored keyforms, blink/mouth animation, physics or runtime export.
Contours are the first authoring pass and need refinement during motion tests.
The eye layers contain the **visible** portions only; occluded iris/sclera and
hair-covered brow segments still need completion. Secondary iris reflections
remain in the iris layer. Skin adjacent to the lids is included in lid patches.

`DRAFT_skin_repair_hidden` is deliberately invisible. It uses OpenCV inpainting
from nearby original colours and currently shows smears near hair/lash boundaries.
It is not approved moving skin. `skin-repair-review.png` exposes that defect.
Enabling the repair also changes composited alpha: it is excluded from the exact
neutral reconstruction. Do not claim a production-ready blink from this PSD.

## Reproduce without overwriting manual work

From the repository root:

```sh
uv run tools/separate_luna_face.py --output /tmp/luna-separation-review
```

The script pins its authoring dependencies and refuses an existing output folder.
Review contour/repair changes in a new output folder before replacing materials.
CMO3 must be authored/saved through Cubism; the script does not invent its format.

On this host, saving the new model directly to the Wine `Z:` repository path
reported a folder access error. Saving to `C:\luna-work` succeeded. The verified
CMO3 was copied to the repo and reopened there. No permission settings were changed.
