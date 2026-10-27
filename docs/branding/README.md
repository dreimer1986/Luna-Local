# Luna-chan branding

The approved mascot is a friendly, fully clothed anime catgirl with Ragdoll
colourpoint ears, blue eyes and a cream sweater, framed by the full moon.

- `luna-chan-concept.png`: the approved light/dark concept sheet.
- `luna-waist-reference.png`: the waist-up illustration retained as the character
  reference. The user confirmed keeping Luna's design on 27 October 2026. Preserve
  her identity; later backgrounds and clothing remain optional, strictly SFW changes.
- `waist-reference-prompt.txt`: provenance for that illustration.
- `ragdoll-concept.png`: the earlier cat-only variant, retained for other uses.
- `source/`: PNG masters exported with the built-in Imagegen tool. Icon and
  default logo use transparency; the dark logo retains its approved midnight
  background to avoid artifacts from automatic wordmark background removal.
- `prompts.md`: the export instructions used with Imagegen.
- `../../custom_components/luna_local/brand/`: the files Home Assistant loads.

The icon is shared between light and dark themes. Home Assistant falls back to
the standard icon when no `dark_icon.png` is supplied. The wordmark has separate
`logo.png` and `dark_logo.png` variants. Every shipped asset has an `@2x` version.
Icons are 256/512 px square; logos retain their aspect ratio at 256/512 px height.

To regenerate the size-normalized files from the masters on Windows:

```powershell
./scripts/export_brand.ps1
```

Only the integration's brand directory is installed by HACS. The concept sheets,
masters and export documentation stay in the repository.
