# Face material study, 2026-10-27

Work in progress, **not a separated production model or a working facial rig**.

- `luna-face-base-draft.png`: built-in ImageGen edit of the approved waist
  reference, removing eyes, brows and mouth and adding background transparency.
  Canvas: 1024 x 1536, RGBA. Nose and cheek shading remain. This is a generated
  draft, not a claim of pixel-identical preservation of the rest of the image.
- `luna-face-base-draft.psd`: the same material packaged as one pixel layer with
  `psd-tools`. Successfully imported as an ArtMesh into `../luna-face-study.cmo3`
  in Cubism Editor 5.3.05 beta1 FREE under Wine. Save verification succeeded.
- `generation-prompts.json`: prompts for the built-in image tool. Both facial
  feature extraction attempts were rejected because they changed feature scale
  and/or placement. Neither was imported into the model.

The study CMO3 retains the original guide image, which is displayed over the
base at the editor's guide opacity. Its faint eyes are the guide, not rigged eye
layers. The original `../luna-reference-only.cmo3` is unchanged. There are no
authored eye/mouth keyforms and no runtime export from this study.

The separate background-removal retry was not selected: the first draft already
had a real alpha channel. Generated previews can display the hidden RGB backdrop;
the actual PNG alpha and the editor's checkerboard were checked.

To package a new material without repainting its pixels:

```sh
uv run --with psd-tools python tools/package_live2d_material.py input.png output.psd
```

An ImageMagick-written PSD was rejected by this editor with `error signature`
at offset `0x00000026`. The psd-tools-written file imported successfully.

Next: obtain accurately registered separate eye/brow/mouth materials, then
separate sclera, iris and lids, complete occluded regions, and author/inspect
half-closed blinks before extending the rig. Do not activate this study in HA.

The text above describes the initial material study. The later working portrait
rig uses selected hidden skin fills plus original features; it is documented in
HANDOFF.md and stored in the private Luna-portrait-v1 package. This study itself
is not the deployed model.
