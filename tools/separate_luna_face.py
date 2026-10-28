# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "psd-tools==1.26.0", "opencv-python-headless==5.0.0.93",
#   "numpy==2.5.4", "Pillow==13.0.0",
# ]
# ///
"""Split approved source pixels into registered layers; never regenerate the art.

uv run tools/separate_luna_face.py --output /tmp/luna-separation-review

Visible layers partition original pixels. Repairs are separate, hidden drafts.
This prepares materials, not a blink deformation or a production-ready model.
"""

import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from psd_tools import PSDImage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/branding/luna-waist-reference.png"
SPEC = ROOT / "docs/live2d/source/face-separation-regions.json"
DEFAULT_OUT = ROOT / "docs/live2d/source/original-separation"


def polygon_mask(size, polygons):
    image = Image.new("L", size)
    draw = ImageDraw.Draw(image)
    for polygon in polygons:
        draw.polygon([tuple(point) for point in polygon], fill=255)
    return np.array(image) > 0


def rgba_layer(source, mask):
    # Do not multiply/feather alpha: each source pixel belongs to exactly one layer.
    result = source.copy()
    result[:, :, 3] = np.where(mask, source[:, :, 3], 0)
    result[~mask, :3] = 0
    return Image.fromarray(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--regions", type=Path, default=SPEC)
    args = parser.parse_args()
    OUT = args.output
    source_path = args.source.resolve()
    spec_path = args.regions.resolve()
    if OUT.exists():
        raise SystemExit(f"Refusing to overwrite existing materials: {OUT}")
    original = Image.open(source_path)
    source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
    spec = json.loads(spec_path.read_text())
    if original.mode != "RGBA" or list(original.size) != spec["canvas"]:
        raise ValueError("Source mode/dimensions differ from the authored contours")
    source = np.array(original)
    size = original.size
    assigned = np.zeros(source.shape[:2], dtype=bool)
    masks = {}

    def add(name, mask):
        if np.any(mask & assigned):
            raise ValueError(f"Overlapping source ownership: {name}")
        masks[name] = mask
        assigned[:] |= mask

    for side, eye in spec["eyes"].items():
        outer = polygon_mask(size, [eye["outer"]])
        upper = polygon_mask(size, [eye["upper"]]) & outer
        interior = polygon_mask(size, [eye["interior"]]) & outer & ~upper
        iris = polygon_mask(size, [eye["iris"]]) & interior
        highlight_image = Image.new("L", size)
        ImageDraw.Draw(highlight_image).ellipse(tuple(eye["highlight"]), fill=255)
        highlight = (np.array(highlight_image) > 0) & iris
        add(f"eye_{side}_upper_lid_skin_patch", upper)
        add(f"eye_{side}_highlight", highlight)
        add(f"eye_{side}_iris_pupil", iris & ~highlight)
        add(f"eye_{side}_sclera_visible", interior & ~iris)
        add(f"eye_{side}_lower_lid_skin_patch", outer & ~upper & ~interior)
    for name, polygons in spec["brows"].items():
        add(name, polygon_mask(size, polygons))
    add("mouth_closed_original", polygon_mask(size, [spec["mouth"]]))

    OUT.mkdir(parents=True)
    (OUT / "layers").mkdir()
    base = rgba_layer(source, ~assigned)
    layers = {"base_original_cut": base}
    layers.update({name: rgba_layer(source, mask) for name, mask in masks.items()})
    reconstructed = base.copy()
    for name, layer in layers.items():
        layer.save(OUT / "layers" / f"{name}.png")
        if name != "base_original_cut":
            reconstructed = Image.alpha_composite(reconstructed, layer)
    rebuilt = np.array(reconstructed)
    visible = source[:, :, 3] > 0
    rgb_mismatch = np.any(rebuilt[:, :, :3] != source[:, :, :3], axis=2) & visible
    alpha_mismatch = rebuilt[:, :, 3] != source[:, :, 3]
    if np.any(rgb_mismatch) or np.any(alpha_mismatch):
        raise ValueError("Visible source pixels or original alpha changed")
    reconstructed.save(OUT / "neutral-reassembled.png")

    # This is deliberately not part of the exact reconstruction. It fills hidden
    # areas from nearby source colours and must be reviewed before moving layers.
    repair_rgb = cv2.inpaint(source[:, :, :3], assigned.astype(np.uint8) * 255,
                            7, cv2.INPAINT_TELEA)
    repaired_source = source.copy()
    repaired_source[:, :, :3] = repair_rgb
    repair = rgba_layer(repaired_source, assigned)
    repair.save(OUT / "skin-repair-hidden-draft.png")
    Image.fromarray(repaired_source).save(OUT / "skin-repair-review.png")

    psd = PSDImage.new("RGBA", size)
    repair_layer = psd.create_pixel_layer(repair, name="DRAFT_skin_repair_hidden")
    repair_layer.visible = False
    for name, layer in layers.items():
        # Cubism uses the PSD layer bounds for initial meshes and template
        # matching. Full-canvas transparent padding makes every face part look
        # body-sized to the matcher. Crop only that padding, retaining offsets.
        bounds = layer.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"Empty material layer: {name}")
        psd.create_pixel_layer(layer.crop(bounds), name=name,
                               left=bounds[0], top=bounds[1])
    psd_path = OUT / "luna-face-separated.psd"
    psd.save(psd_path)
    reopened = PSDImage.open(psd_path)
    visible_layers = [layer for layer in reopened if layer.visible]
    if [layer.name for layer in visible_layers] != list(layers):
        raise ValueError("PSD layer names/order/visibility did not round-trip")
    for layer in visible_layers:
        actual = np.array(layer.topil())
        bounds = layers[layer.name].getchannel("A").getbbox()
        if tuple(layer.bbox) != bounds:
            raise ValueError(f"PSD moved source pixels in {layer.name}")
        expected = np.array(layers[layer.name].crop(bounds))
        if actual.shape != expected.shape or not np.array_equal(actual, expected):
            raise ValueError(f"PSD altered source pixels in {layer.name}")

    # A source-coordinate map makes contour mistakes reviewable, without implying
    # these polygons already provide complete moving eyelids or occluded irises.
    map_image = original.copy().convert("RGB")
    overlay = Image.new("RGBA", size)
    colors = [(240, 80, 60), (40, 190, 230), (100, 220, 110),
              (230, 160, 30), (190, 90, 220)]
    for i, mask in enumerate(masks.values()):
        tint = np.zeros_like(source)
        tint[:, :, :3] = colors[i % len(colors)]
        tint[:, :, 3] = mask.astype(np.uint8) * 100
        overlay = Image.alpha_composite(overlay, Image.fromarray(tint))
    map_image = Image.alpha_composite(map_image.convert("RGBA"), overlay)
    map_image.save(OUT / "separation-map.png")
    box = tuple(spec.get("review_box", (365, 255, 665, 495)))
    views = [(original, "Original"), (reconstructed, "Reassembled: exact pixels"),
             (map_image, "Source ownership masks"),
             (Image.fromarray(repaired_source), "Hidden skin repair: DRAFT")]
    sheet = Image.new("RGB", (1200, 1040), "#242936")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    for i, (view, label) in enumerate(views):
        x, y = (i % 2) * 600, (i // 2) * 520
        draw.text((x + 12, y + 10), label, fill="white", font=font)
        sheet.paste(view.convert("RGB").crop(box).resize((600, 480)), (x, y + 40))
    sheet.save(OUT / "face-review.png")
    if hashlib.sha256(source_path.read_bytes()).hexdigest() != source_hash:
        raise ValueError("Source file changed during separation")
    manifest = {
        "source": str(source_path.relative_to(ROOT) if source_path.is_relative_to(ROOT) else source_path),
        "source_sha256": source_hash,
        "contours_sha256": hashlib.sha256(spec_path.read_bytes()).hexdigest(),
        "canvas": list(size),
        "coordinate_system": "viewer L/R, original pixel positions, no scaling",
        "visible_layers": list(layers),
        "hidden_layers": ["DRAFT_skin_repair_hidden"],
        "validation": {
            "visible_rgb_mismatched_pixels": int(np.count_nonzero(rgb_mismatch)),
            "alpha_mismatched_pixels": int(np.count_nonzero(alpha_mismatch)),
            "psd_layer_pixels_exact": True,
            "source_unchanged": hashlib.sha256(source_path.read_bytes()).hexdigest()
                                == source_hash,
        },
        "limitations": [
            "No keyforms, blink animation, mouth opening, physics or MOC3 export.",
            "Visible iris/sclera only; occluded areas are not fully reconstructed.",
            "Lid layers include adjacent skin; contours need motion review.",
            "Only the principal eye highlights have separate layers.",
            "Skin repair is an inpainting draft, hidden in the PSD by default.",
            "Transparent RGB is retained but excluded from visual equality checks.",
        ],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest["validation"], indent=2))
    print(f"Saved {len(layers)} visible layers and one hidden repair draft to {OUT}")


if __name__ == "__main__":
    main()
