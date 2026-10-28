"""Combine registered body and face separations without changing source pixels.

This creates a new authoring PSD, not a replacement for an already rigged CMO3.
Hidden inpainting drafts are deliberately excluded.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from psd_tools import PSDImage


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--body', type=Path, required=True)
    parser.add_argument('--face', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        parser.error('Choose a new output directory; existing work is preserved.')
    body = json.loads((args.body / 'manifest.json').read_text())
    face = json.loads((args.face / 'manifest.json').read_text())
    if body['sha256'] != face['source_sha256'] or not body['mao_body']:
        raise ValueError('Inputs must share the same source and use Mao body names')
    source = Image.open(args.body / 'neutral-reassembled.png').convert('RGBA')
    head = Image.open(args.body / 'layers/Luna Head Reference.png').convert('RGBA')
    head_pixels = np.array(head)
    layers = {name: Image.open(args.body / 'layers' / (name + '.png')).convert('RGBA')
              for name in body['layers'] if name != 'Luna Head Reference'}
    # Remove each facial patch from the head once. No resampling or alpha blending
    # at boundaries: source ownership remains disjoint, including antialiased pixels.
    face_layers = {}
    for name in face['visible_layers']:
        if name == 'base_original_cut':
            continue
        layer = Image.open(args.face / 'layers' / (name + '.png')).convert('RGBA')
        pixels = np.array(layer)
        if layer.size != source.size:
            raise ValueError('Face canvas differs from body canvas')
        occupied = pixels[:, :, 3] > 0
        if not np.array_equal(pixels[occupied], head_pixels[occupied]):
            raise ValueError('Face patch overlaps another part or lies outside head: ' + name)
        head_pixels[occupied] = 0
        face_layers[name] = layer
    layers['Luna Head Base'] = Image.fromarray(head_pixels)
    layers.update(face_layers)
    rebuilt = Image.new('RGBA', source.size)
    psd = PSDImage.new('RGBA', source.size)
    for name, layer in layers.items():
        bounds = layer.getchannel('A').getbbox()
        if bounds is None:
            raise ValueError('Empty layer: ' + name)
        psd.create_pixel_layer(layer.crop(bounds), name=name, left=bounds[0], top=bounds[1])
        rebuilt = Image.alpha_composite(rebuilt, layer)
    original, actual = np.array(source), np.array(rebuilt)
    visible = original[:, :, 3] > 0
    if not np.array_equal(original[:, :, 3], actual[:, :, 3]) or not np.array_equal(original[visible], actual[visible]):
        raise ValueError('Combined layers changed source pixels')
    args.output.mkdir(parents=True)
    psd_path = args.output / 'luna-fullbody-face-separated.psd'
    psd.save(psd_path)
    reopened = PSDImage.open(psd_path)
    if [layer.name for layer in reopened] != list(layers):
        raise ValueError('PSD layer order changed')
    for layer in reopened:
        expected = layers[layer.name]
        bounds = expected.getchannel('A').getbbox()
        if tuple(layer.bbox) != bounds or not np.array_equal(np.array(layer.topil()), np.array(expected.crop(bounds))):
            raise ValueError('PSD pixels or registration changed: ' + layer.name)
    rebuilt.save(args.output / 'neutral-reassembled.png')
    manifest = {
        'source_sha256': body['sha256'], 'layers': list(layers),
        'psd_sha256': hashlib.sha256(psd_path.read_bytes()).hexdigest(),
        'visible_pixels_exact': True, 'psd_roundtrip_exact': True,
        'limitations': ['Material preparation only; no rig or runtime export',
                       'No hidden skin repair or joint overlaps included',
                       'Hair and ears remain attached to head base',
                       'Eyes contain only visible source pixels; no complete hidden iris',
                       'Mouth is the original closed mouth; no mouth interior'],
    }
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{len(layers)} layers; exact reconstruction and PSD round-trip: {psd_path}')


if __name__ == '__main__':
    main()
