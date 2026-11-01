from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
b=Path('/workspace/trident-png-remaining-2026-11-01');j=json.load(open(b/'c4-51-pixel-input.json'));a=np.array(Image.open(j['png']).convert('RGB')).astype(float);h,w=a.shape[:2];back=np.ones_like(a)*255;models=[];foreground=68.
exclusions=[]
for t in j['captionLocations']:
 x0,y0,x1,y1=t['cropHint'];exclusions.append([x0,y0,x1,y1])
for r in j['relations']:
 p,q=map(np.array,r['actualBodyPortModel']);dy=q[1]-p[1]
 if abs(dy)<20:continue
 samples=[]
 for yy in range(int(min(p[1],q[1]))+10,int(max(p[1],q[1]))-10):
  if 526<=yy<=531:continue
  t=(yy+.5-p[1])/dy;guide=p[0]+.5*(q[0]-p[0])*t+.5*(q[0]-p[0])*t*t;lo=max(0,int(guide)-5);hi=min(w,int(guide)+6)
  if any(x0-2<guide<x1+2 and y0-2<=yy<y1+2 for x0,y0,x1,y1 in exclusions):continue
  patch=a[yy,lo:hi];gray=patch.max(axis=1)-patch.min(axis=1)<3;alpha=np.where(gray,np.clip((255-patch[:,1])/(255-foreground),0,1),0);mass=alpha.sum()
  if .5<mass<2: samples.append([yy+.5,float(np.average(np.arange(lo,hi)+.5,weights=alpha)),float(mass)])
 if len(samples)<20:models.append({'source':r['source'],'target':r['target'],'unavailable':'insufficientindependentoutsidecaptionstemrows','sampleCount':len(samples)});continue
 data=np.array(samples);train=data[::2];test=data[1::2];coef=np.polyfit(train[:,0],train[:,1],2);width=float(np.median(train[:,2]));centerResidual=float(np.abs(np.polyval(coef,test[:,0])-test[:,1]).max());holdout=[]
 for yy,xc,mass in test:
  y=int(yy);predX=float(np.polyval(coef,yy));lo=int(predX)-4;hi=int(predX)+5;coverage=np.maximum(0,np.minimum(np.arange(lo,hi)+1,predX+width/2)-np.maximum(np.arange(lo,hi),predX-width/2));pred=255-(255-foreground)*coverage;holdout.extend(abs(pred-a[y,lo:hi,1])/(255-foreground))
 mae=float(np.mean(holdout));qualified=centerResidual<=.5 and mae<=.04
 models.append({'source':r['source'],'target':r['target'],'fixedFromVisibleOutsideGlyphRows':samples,'fitCoefficientsXofPhysicalY':coef.tolist(),'measuredCrossSectionMass':width,'holdoutMaxCenterResidualPx':centerResidual,'holdoutFullRowNormalizedMeanResidual':mae,'qualified':qualified})
 if qualified:
  for y in range(int(min(p[1],q[1])),int(max(p[1],q[1]))):
   x=float(np.polyval(coef,y+.5));lo=max(0,int(x)-3);hi=min(w,int(x)+4);coverage=np.maximum(0,np.minimum(np.arange(lo,hi)+1,x+width/2)-np.maximum(np.arange(lo,hi),x-width/2));back[y,lo:hi]=np.minimum(back[y,lo:hi],(255-(255-foreground)*coverage)[:,None])
# Independent boundaryline kernel: periodicpaint learned onlyfromoutsidecaption
# actualwhite regions, with aheldoutphasecheck; no expectedglyphmask is read.
dash=[]
for y in range(527,531):
 row=[]
 for phase in range(14):
  xs=[x for x in range(150,1414)if x%14==phase and (x<450 or x>900)]
  vals=a[y,xs,1];row.append(float(np.median(vals)))
 for x in range(150,1414):back[y,x]=np.minimum(back[y,x],row[x%14])
 dash.append({'physicalRow':y,'phaseRgbGreen':row})
Image.fromarray(np.clip(back,0,255).astype('uint8')).save(b/'c4-51-independent-stem-backdrop.png');result={'schema':'trident-c4-independent-outside-glyph-stem-backdrop-v1','launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'inputSha256':hashlib.sha256((b/'c4-51-pixel-input.json').read_bytes()).hexdigest(),'models':models,'boundaryDash':dash,'scope':'Actualphysicalstemgraypaint sampledONLYoutsideallpermissivecaptioncrops; sharedquadraticx(y)fixedfromevenrows andvalidatedoddrows beforeglyphmodel. NoSUTSVGgeometry,captionoffsetsorfontmasks enterfit. Inadequatemodelsarenotpainted/credited. Independentlyperiodicgroupboundarykernelusesoutsidecaptionwhiteactualsegments. Fullglyph+fixedstemcomposite muststillmatchactualPNG.', 'rendererInvocations':0};(b/'c4-51-stem-backdrop-proof.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps([{k:v for k,v in r.items()if k!='fixedFromVisibleOutsideGlyphRows'}for r in models]))
