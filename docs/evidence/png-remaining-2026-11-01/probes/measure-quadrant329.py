from pathlib import Path
from PIL import Image
import json,numpy as np,hashlib
b=Path('/workspace/trident-png-remaining-2026-11-01');rows=json.load(open('/workspace/trident-png-held-2026-11-01/hold-inputs.json'));out=[]
# Crops follow actual independently viewed bodies. Expected coordinates/colors
# are not used to select a fitted circle or transform.
observed=[('A',449,470,[435,455,463,486]),('B',403,427,[389,414,416,440]),('C',356,385,[327,355,384,414]),('D',310,342,[287,319,332,365]),('E',263,300,[243,280,284,320]),('F',217,257,[201,242,232,273])]
expected={'A':{'r':12,'xy':[.9,0]},'B':{'r':10,'xy':[.8,.1],'fill':[255,51,0]},'C':{'r':25,'xy':[.7,.2],'fill':[0,255,51]},'D':{'r':15,'xy':[.6,.3],'fill':[255,51,240],'stroke':[0,255,15],'width':5},'E':{'r':10,'xy':[.5,.4],'fill':[144,131,66],'stroke':[49,0,133],'width':10},'F':{'r':10,'xy':[.4,.5],'fill':[0,0,255]}}
for h in rows:
 if h['index']!=329:continue
 a=np.array(Image.open(h['actualImagePath']).convert('RGB')).astype(float);border=a[44,30].copy();borderMask=np.max(abs(a-border),axis=2)<1;columns=np.where(borderMask.sum(axis=0)>300)[0];lines=np.where(borderMask.sum(axis=1)>400)[0];columnRuns=np.split(columns,np.where(np.diff(columns)>1)[0]+1);rowRuns=np.split(lines,np.where(np.diff(lines)>1)[0]+1);assert len(columnRuns)==2 and len(rowRuns)==2;centers=lambda groups:[float((g[0]+g[-1]+1)/2)for g in groups];cxFrame=centers(columnRuns);cyFrame=centers(rowRuns);frame={'left':cxFrame[0],'right':cxFrame[1],'top':cyFrame[0],'bottom':cyFrame[1]};points=[]
 # Independent border ownership: exact violet rectangle strokes span these
 # horizontal/vertical locations; the center dividers are at263 and257.5.
 for name,x,y,crop in observed:
  e=expected[name];fill=a[y,x].copy();stroke=np.array(e.get('stroke',fill),float);x0,y0,x1,y1=crop;patch=a[y0:y1,x0:x1];colors=[fill,stroke];owned=np.any([np.max(np.abs(patch-c),axis=2)<1 for c in colors],axis=0);yy,xx=np.where(owned);cy=(yy.min()+yy.max()+1)/2+y0
  samples=a[y,x0:x1];bgLeft=a[y,x0-3];bgRight=a[y,x1+3];occupancy=[];strokealpha=[]
  for ix,color in enumerate(samples):
   bg=bgLeft if ix<(x1-x0)/2 else bgRight;occ=[]
   for fg in colors:
    d=fg-bg;alpha=float(np.clip(np.dot(color-bg,d)/max(1,np.dot(d,d)),0,1));res=np.linalg.norm(color-(bg+alpha*d));occ.append((res,alpha))
   err,alpha=min(occ);occAlpha=alpha if err<4 else 0
   between=stroke-fill
   if np.dot(between,between)>1:
    mix=float(np.clip(np.dot(color-fill,between)/np.dot(between,between),0,1))
    if np.linalg.norm(color-(fill+mix*between))<4:occAlpha=1
   occupancy.append(occAlpha)
   fits=[]
   for under in[bg,fill]:
    d=stroke-under
    if np.dot(d,d)<1:continue
    alpha=float(np.clip(np.dot(color-under,d)/np.dot(d,d),0,1));res=np.linalg.norm(color-(under+alpha*d));fits.append((res,alpha))
   if fits:
    err,alpha=min(fits);strokealpha.append(alpha if err<4 else 0)
   else:strokealpha.append(0)
  mass=sum(occupancy);cx=float(np.average(np.arange(x0,x1)+.5,weights=occupancy));outerR=mass/2;width=sum(strokealpha)/2 if 'width'in e else 0;radius=outerR-width/2;projected=[frame['left']+e['xy'][0]*(frame['right']-frame['left']),frame['bottom']-e['xy'][1]*(frame['bottom']-frame['top'])];errs=[abs(cx-projected[0]),abs(cy-projected[1])];radiusError=abs(radius-e['r']);widthError=abs(width-e.get('width',0));fillPass='fill'not in e or max(abs(fill-np.array(e['fill'])))<=1
  measured={'label':'Campaign '+name,'actualObservedCrop':crop,'actualGeometryCenter':[cx,cy],'actualUpperLowerColorExtrema':[int(yy.min()+y0),int(yy.max()+y0)],'actualFillRgb':fill.tolist(),'actualHorizontalOccupancyMass':mass,'actualOuterRadius':outerR,'actualStrokeWidth':width,'actualCenterlineRadius':radius,'sourceProjectedCenter':projected,'centerErrorsPx':errs,'radiusErrorPx':radiusError,'widthErrorPx':widthError,'positive':bool(max(errs)<=1 and radiusError<=1 and widthError<=1 and fillPass),'wrongControls':{'radiusPlus3Pass':abs(radius-(e['r']+3))<=1,'centerXPlus5Pass':abs(cx-(projected[0]+5))<=1,'fillRedPass':'fill'in e and e['fill']==[255,0,0]}}
  assert measured['positive'],measured;assert not measured['wrongControls']['radiusPlus3Pass'] and not measured['wrongControls']['centerXPlus5Pass'];points.append(measured)
 out.append({'index':329,'project':h['project'],'pngSha256':h['pngSha256'],'actualPlotFrame':frame,'actualBorderColorRgb':border.tolist(),'physicalBorderColumns':columns.tolist(),'physicalBorderRows':lines.tolist(),'points':points,'manualCompleteVisibleFacts':'Exacttitle,all6uniqueCampaigncaptions,bothorderedaxisstrings,and4numberedquadrantlabelsintheircorrectquadrants. DirectBorangeandFblueoverridesclasses; Dfillmagenta+green5pxborder; Eolive+purple10pxborder; Cgreen25radius,uselessunpaintedcyanbordercolornotclaimedwithoutwidth; Aunrequesteddefaultskinignored.'})
r={'schema':'trident-quadrant-effective-source-appearance-pixel-proof-v1','launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'rows':out,'scope':'IndependentactualPNGcoloredcircleextent,center,horizontalcoverageandannulusmass; noactualSVGgeometry/styles supplytruth. ExplicitpixelRatio1retainedtransport; allauthoredradii/colors/widths/effectiveprecedence checked. No defaultskinorabsentstroke width invented.','rendererInvocations':0};(b/'quadrant329-effective-paint-proof.json').write_text(json.dumps(r,indent=2,default=float)+'\n');print(json.dumps(out,default=float))
