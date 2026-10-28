"""Pixel-preserving first body separation for the private Mao template experiment.

Requires Pillow, numpy and psd-tools. This is an authoring draft: joints still
need hidden overlap artwork and the head still needs facial/hair separation.
Viewer-left/right names deliberately do not imply Cubism anatomical naming.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from psd_tools import PSDImage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/live2d/references/luna-fullbody-study-v1.png'

# Ordered ownership contours in the unchanged 1024 x 1536 source canvas.
REGIONS = {
    'shoe_viewer_L': [(330,1433),(397,1433),(428,1416),(487,1418),(520,1440),(520,1536),(330,1536)],
    'shoe_viewer_R': [(600,1433),(650,1414),(716,1424),(780,1433),(800,1536),(580,1536)],
    'calf_viewer_L': [(0,1100),(500,1100),(535,1536),(0,1536)],
    'calf_viewer_R': [(500,1100),(1024,1100),(1024,1536),(535,1536)],
    'thigh_viewer_L': [(349,764),(400,752),(460,759),(510,772),(520,900),(500,1100),(320,1100)],
    'thigh_viewer_R': [(510,772),(570,770),(637,764),(680,745),(720,1100),(500,1100),(520,900)],
    'hand_viewer_L': [(0,756),(249,756),(274,770),(294,790),(321,870),(0,900)],
    'hand_viewer_R': [(744,772),(768,758),(1024,745),(1024,900),(714,890),(725,804)],
    'sleeve_lower_viewer_L': [(0,570),(304,570),(344,589),(393,602),(376,650),(363,691),(354,722),(335,740),(312,741),(286,776),(247,763),(0,756)],
    'sleeve_lower_viewer_R': [(633,592),(672,577),(706,572),(1024,555),(1024,745),(768,758),(744,772),(717,744),(689,737),(669,714),(656,667)],
    'sleeve_upper_viewer_L': [(0,335),(377,335),(398,372),(412,430),(417,490),(413,539),(402,578),(393,602),(344,589),(304,570),(0,570)],
    'sleeve_upper_viewer_R': [(632,330),(1024,330),(1024,555),(706,572),(672,577),(633,592),(622,550),(617,498),(620,443),(631,388)],
    'head_hair_ears_unseparated': [(0,0),(1024,0),(1024,330),(685,330),(659,330),(623,336),(594,310),(591,284),(570,269),(540,280),(505,276),(470,269),(444,282),(433,308),(405,328),(377,335),(0,335)],
}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--mao-body',action='store_true',
                        help='Use whole legs and Mao anatomical body names; head remains an unrigged reference.')
    args=parser.parse_args()
    if args.output.exists(): parser.error('Choose a new output folder; existing work is never overwritten.')
    source=Image.open(SOURCE).convert('RGBA')
    if source.size != (1024,1536): raise ValueError('Contour canvas mismatch')
    pixels=np.array(source); assigned=np.zeros(pixels.shape[:2],bool); layers={}
    for name,points in REGIONS.items():
        mask=Image.new('L',source.size); ImageDraw.Draw(mask).polygon(points,fill=255)
        owned=(np.array(mask)>0)&~assigned; assigned|=owned
        layer=pixels.copy();layer[~owned]=0; layers[name]=Image.fromarray(layer)
    torso=pixels.copy();torso[assigned]=0
    layers={'torso_sweater':Image.fromarray(torso),**layers}
    if args.mao_body:
        # Mao rigs the leg as a continuous mesh. Avoid introducing an artificial
        # knee seam. Anatomical right is viewer-left in this front-facing source.
        mapped={'Hoodie Body': layers['torso_sweater']}
        for viewer,anatomical in [('L','R'),('R','L')]:
            mapped['Leg '+anatomical]=Image.alpha_composite(
                layers['thigh_viewer_'+viewer],layers['calf_viewer_'+viewer])
            for original,target in [('shoe','Shoe'),('hand','Hand'),
                                    ('sleeve_lower','Forearm'),('sleeve_upper','Upper Arm')]:
                mapped[target+' '+anatomical]=layers[original+'_viewer_'+viewer]
        mapped['Luna Head Reference']=layers['head_hair_ears_unseparated']
        layers=mapped
    args.output.mkdir(parents=True);(args.output/'layers').mkdir()
    psd=PSDImage.new('RGBA',source.size); rebuilt=Image.new('RGBA',source.size)
    for name,layer in layers.items():
        bounds=layer.getchannel('A').getbbox()
        if not bounds: raise ValueError(f'Empty layer: {name}')
        layer.save(args.output/'layers'/f'{name}.png')
        psd.create_pixel_layer(layer.crop(bounds),name=name,left=bounds[0],top=bounds[1])
        rebuilt=Image.alpha_composite(rebuilt,layer)
    result=np.array(rebuilt);visible=pixels[:,:,3]>0
    if np.any(result[:,:,3]!=pixels[:,:,3]) or np.any(result[visible]!=pixels[visible]):
        raise ValueError('Source pixels changed during reconstruction')
    psd_path=args.output/'luna-body-separated.psd';psd.save(psd_path)
    reopened=PSDImage.open(psd_path)
    for layer in reopened:
        original=layers[layer.name];bounds=original.getchannel('A').getbbox()
        if tuple(layer.bbox)!=bounds or not np.array_equal(np.array(layer.topil()),np.array(original.crop(bounds))):
            raise ValueError('PSD did not preserve registered pixels: '+layer.name)
    rebuilt.save(args.output/'neutral-reassembled.png')
    overlay=source.copy();draw=ImageDraw.Draw(overlay)
    for i,(name,points) in enumerate(REGIONS.items()):
        color=['#ff5454','#31d5ff','#9dff78','#ffcc33'][i%4]
        draw.line(points+[points[0]],fill=color,width=2)
    overlay.save(args.output/'contours.png')
    manifest={'source':str(SOURCE.relative_to(ROOT)),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
      'layers':list(layers),'contours':REGIONS,'mao_body':args.mao_body,'visible_pixels_exact':True,'psd_roundtrip_exact':True,
      'limitations':['No hidden joint overlaps yet','Head, hair and ears still combined','No authored keyforms or runtime export','Contours need visual and movement review']}
    (args.output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'{len(layers)} layers, exact visible reconstruction and PSD round-trip: {psd_path}')

if __name__=='__main__':main()
