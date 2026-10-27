"""Package an existing RGBA PNG as a Cubism-importable PSD without repainting it.

Run with: uv run --with psd-tools python tools/package_live2d_material.py INPUT OUTPUT
The PSD contains one named pixel layer. This does not separate or rig artwork.
"""

import argparse
from pathlib import Path

from PIL import Image
from psd_tools import PSDImage


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--name", default="face_base_draft")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Output already exists; choose a new filename.")
    with Image.open(args.input) as image:
        if image.mode != "RGBA":
            parser.error("Expected an RGBA source with its original alpha channel.")
        psd = PSDImage.new("RGBA", image.size)
        psd.create_pixel_layer(image, name=args.name)
        psd.save(args.output)
    reopened = PSDImage.open(args.output)
    if len(reopened) != 1 or reopened[0].name != args.name:
        raise RuntimeError("PSD layer verification failed")
    print(f"Saved {args.output}: {reopened.size}, one pixel layer, no rig")


if __name__ == "__main__":
    main()
