# /// script
# dependencies = ["opencv-python-headless", "numpy", "Pillow"]
# ///
import argparse,hashlib
import cv2,numpy as np
from PIL import Image
from pathlib import Path
parser=argparse.ArgumentParser(description='Polish the mouth in the 2026-10-27 Luna portrait atlas; preserve all eye pixels.')
parser.add_argument('atlas',type=Path)
parser.add_argument('parts',type=Path)
parser.add_argument('output',type=Path)
args=parser.parse_args()
if hashlib.sha256(args.atlas.read_bytes()).hexdigest() != 'a54acfad63adcf4059c1570b28e9c9a5b669a2e2501cb12f32b7fff03bd6440c':
 parser.error('This patch requires the original 2026-10-27 atlas layout. Re-exported atlases need a new mapping.')
root=args.parts
atlas=np.array(Image.open(args.atlas).convert('RGBA'))
source=np.array(Image.open(Path(__file__).resolve().parents[1]/'docs/branding/luna-waist-reference.png').convert('RGBA'))
mask=np.zeros(source.shape[:2],np.uint8);mask[432:458,491:572]=255
clean=cv2.inpaint(source[:,:,:3],mask,5,cv2.INPAINT_TELEA)
upper=np.array(Image.open(root/'D_MOUTH_03.png'))
xs=np.arange(498,561);ys=np.array([np.flatnonzero(upper[:,x,3])[-1] for x in xs]);fit=np.polyfit(xs-530,ys,3)
for name,loc,b in [('D_MOUTH_03',(832,1622),(480,412,581,452)),('D_MOUTH_04',(608,1622),(480,438,581,485))]:
 x0,y0,x1,y1=b; a=np.array(Image.open(root/(name+'.png')))[y0:y1,x0:x1].copy();a[:,:,:3]=clean[y0:y1,x0:x1]
 for x in range(x0,x1):
  seam=float(np.polyval(fit,np.clip(x,498,560)-530))
  for y in range(y0,y1):
   cov=np.clip(seam-y+.5,0,1) if name.endswith('03') else np.clip(y-seam+.5,0,1)
   a[y-y0,x-x0,3]=round(255*cov)
   if 498<=x<=560:
    # Retain the approved smile's colour near the lip seam, but taper the left
    # corner instead of carrying a dark point into the open mouth.
    taper=max(0,min(1,(x-507)/8,(560-x)/4))
    edge=np.exp(-((y-seam)/1.2)**2)*taper
    a[y-y0,x-x0,:3]=np.uint8(a[y-y0,x-x0,:3]*(1-edge)+source[y,x,:3]*edge)
 ax,ay=loc;atlas[ay:ay+a.shape[0],ax:ax+a.shape[1]]=a
# Hide the inherited template tooth strip; its mapping is unsuitable for this mouth.
atlas[1623:1644,1738:1799,3]=0
# Colour the cavity and its own upper tooth band in the same UV coordinates.
# The lip masks occlude this artwork at closure; no separate mismatched tooth mesh.
tops=[]
for tx in range(1294,1349):
 ty=np.flatnonzero(atlas[1623:1657,tx,3]>180)
 if len(ty):tops.append((tx,1623+ty[0]))
top_curve=np.polyfit(np.array([v[0] for v in tops])-1320,[v[1] for v in tops],3)
for x in range(1289,1354):
 ys=np.flatnonzero(atlas[1623:1657,x,3]>180)
 if not len(ys):continue
 top=float(np.polyval(top_curve,x-1320))
 taper=max(0,min(1,(x-1294)/8,(1348-x)/8))
 band=4.0*taper
 fang=5.5*max(0,1-abs(x-1335)/4)
 for y in range(1623,1657):
  t=(y-1623)/34
  color=np.array([100,44,46])*(1-t)+np.array([185,94,103])*t
  # Soft tongue highlight, inspired by the approved logo smile.
  tongue=np.exp(-(((x-1325)/21)**2+((y-1651)/9)**2))*0.75
  color=color*(1-tongue)+np.array([220,127,138])*tongue
  tooth=np.clip(top+band+fang-y+.5,0,1)
  atlas[y,x,:3]=np.uint8(color*(1-tooth)+np.array([252,242,222])*tooth)
Image.fromarray(atlas).save(args.output)
