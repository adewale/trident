from pathlib import Path
from PIL import Image
import numpy as np,json,gzip,xml.etree.ElementTree as E,hashlib
from scipy.ndimage import label,find_objects
b=Path('/workspace/trident-png-remaining-2026-11-01');p=Path('/workspace/trident-png-full-2026-10-31/docs/png/drawings/6ceadc3c8162e7da321810d46866849c3c83c92fde54ce73e97f30a5f2345b73.png');a=np.array(Image.open(p).convert('RGB')).astype(float);mask=(a[:,:,2]-a[:,:,0]>30)&(a[:,:,1]-a[:,:,0]>15)&(a[:,:,0]<170);cc,n=label(mask);boxes=[]
for y,x in find_objects(cc):
 if x.stop-x.start>150 and y.stop-y.start>70:boxes.append({'x':x.start,'y':y.start,'width':x.stop-x.start,'height':y.stop-y.start})
boxes.sort(key=lambda r:(0 if r['y']<400 else 1,r['x']));names=['spa','ma','db','sign','accounts','security','mbsfacade'];nodes=dict(zip(names,boxes));m=(a.max(axis=2)-a.min(axis=2)<2)&(a[:,:,0]>90)&(a[:,:,0]<180);cc,n=label(m)
for y,x in find_objects(cc):
 if x.stop-x.start>150 and y.stop-y.start>70:nodes['mbs']={'x':x.start,'y':y.start,'width':x.stop-x.start,'height':y.stop-y.start}
assert len(nodes)==8
contract=next(r for r in json.load(open('/workspace/trident-png-remaining-completion/corpus/docs-reviewed.json'))if r['id']=='packages/mermaid/src/docs/syntax/c4.md:267');relations=contract['expected']['facts']['relations'];styles=contract['expected']['facts']['authored-style']
def intersection(n,target):
 c=np.array([n['x']+n['width']/2,n['y']+n['height']/2]);other=np.array([target['x']+target['width']/2,target['y']+target['height']/2]);v=other-c;k=min(n['width']/2/abs(v[0])if v[0]else 1e9,n['height']/2/abs(v[1])if v[1]else 1e9);return(c+k*v).tolist()
ports=[]
for r in relations:
 s=r['source'];t=r['target'];start=intersection(nodes[s],nodes[t]);end=intersection(nodes[t],nodes[s]);style=next((r['attributes']for r in styles if set(r['positions'])==set([s,t])),{});pred=[(start[0]+end[0])/2+float(style.get('offsetX',0)),(start[1]+end[1])/2+float(style.get('offsetY',0))]
 # Pixel witnesses near every physical port: excludecoloredbodyfill. Gray-over-blue
 # antialiasisallowed; everyendpointmusthaveindependentdarkstem/headpaint.
 witnesses=[]
 for x,y in[start,end]:
  x0,y0=max(0,int(x)-3),max(0,int(y)-3);patch=a[y0:int(y)+4,x0:int(x)+4];distance=patch.max(axis=2)-patch.min(axis=2);dark=(distance<16)&(patch.max(axis=2)<180);witnesses.append({'patch':[x0,y0,int(x)+4,int(y)+4],'darkStemOrArrowPixels':int(dark.sum())})
 ports.append({'source':s,'target':t,'caption':r['label'],'technology':r['technology'],'actualBodyPortModel':[start,end],'actualPortPixelWitnesses':witnesses,'literalOffsets':style,'predictedCaptionLogicalLeftAndMiddle':pred})
svg=Path('/workspace/trident-svg-final-2026-11-01/docs-complete/drawings/e257c6af2fba88fa2a375cb3d1af1bd3d46f0151379817514668fb00ac208f5e.svg.gz');root=E.fromstring(gzip.decompress(svg.read_bytes()));ns='{http://www.w3.org/2000/svg}';locations=[]
for g in root.iter(ns+'g'):
 if any(c.tag in[ns+'line',ns+'path']and any(k in c.attrib for k in['marker-end','marker-start'])for c in g):
  for t in g.iter(ns+'text'):
   text=''.join(t.itertext());x=float(t.attrib['x']);y=float(t.attrib['y'])+70;locations.append({'text':text,'cropHint':[int(x-100),int(y-10),int(x+100),int(y+14)],'italic':t.attrib.get('font-style')=='italic' or 'font-style: italic' in t.attrib.get('style','')})
# Crop hints fromSVG locateonly; actualglyphregistrationandbody/ports usePNGpixels.
r={'png':str(p),'pngSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'nodes':nodes,'relations':ports,'captionLocations':locations,'scope':'SVGtexthints onlybound a permissivecrop; notusedasmeasuredanchorortruth. Allbodybounds,portpaint,andglyphpositionscomeactualPNG. Bodyidentitiesmanuallyreadfromuniquevisibleheaders andscope.'};(b/'c4-51-pixel-input.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'nodes':nodes,'relations':ports}))
