from pathlib import Path
import json,hashlib,math,numpy as np
from PIL import Image
base=Path('/workspace/trident-png-held-2026-11-01');p=Path('/workspace/trident-png-full-2026-10-31/docs/png/drawings/ee004a9d7e59fe440f3b1c9bf6eeaef3abebd8a51468b0ce5cadd3b1359b0d0d.png');a=np.asarray(Image.open(p).convert('RGB'));h,w,_=a.shape
# The plot frame is measured using grayscale pixels only, excluding all data
# curves and legend colors. No source vectors/tension enter the circle fit.
pts=[]
for y in range(60,h-60):
 gray=(a[y,:,0]==a[y,:,1])&(a[y,:,1]==a[y,:,2])&(a[y,:,0]>128)&(a[y,:,0]<254)
 runs=[];start=None
 for x,hit in enumerate(np.r_[gray,False]):
  if hit and start is None:start=x
  elif not hit and start is not None:
   if x-start>=10:runs.append((start,x-1))
   start=None
 if runs:pts.extend([(runs[0][0]+.5,y+.5),(runs[-1][1]+.5,y+.5)])
pts=np.asarray(pts);keep=np.ones(len(pts),bool)
for _ in range(4):
 q=pts[keep];matrix=np.c_[2*q[:,0],2*q[:,1],np.ones(len(q))];cx,cy,c=np.linalg.lstsq(matrix,(q*q).sum(axis=1),rcond=None)[0];radius=math.sqrt(c+cx*cx+cy*cy);residual=np.abs(np.hypot(pts[:,0]-cx,pts[:,1]-cy)-radius);keep=residual<1.25
cx,cy=float(cx),float(cy);radius=float(radius);circle={'center':[cx,cy],'radius':radius,'samples':int(keep.sum()),'maxInlierResidual':float(residual[keep].max()),'rmsResidual':float(np.sqrt((residual[keep]**2).mean()))}
# Measure dark, neutral axis arms in the central disk. Endpoints come from
# actual pixels; source factor .25 is compared only after these measurements.
yy,xx=np.indices((h,w));dx=xx+.5-cx;dy=yy+.5-cy;rr=np.hypot(dx,dy);neutral=(a.max(axis=2)-a.min(axis=2)<3)&(a.max(axis=2)<96)&(rr<radius*.45)
axis=[]
for k in range(5):
 angle=-math.pi/2+2*math.pi*k/5;delta=np.arctan2(np.sin(np.arctan2(dy,dx)-angle),np.cos(np.arctan2(dy,dx)-angle));hits=neutral&(np.abs(delta)<.08)&(rr>10);r=float(rr[hits].max());axis.append({'axis':'ABCDE'[k],'angleDegrees':angle*180/math.pi,'farthestInkRadius':r,'observedRadiusRatio':r/radius})
colors=[np.array([255,0,0]),np.array([0,255,0]),np.array([0,0,255])];vectors=[[1,2,3,4,5],[5,4,3,2,1],[3,3,3,3,3]]
def samples(values,tension):
 theta=-math.pi/2+np.arange(5)*2*math.pi/5;v=np.c_[cx+radius*np.array(values)/5*np.cos(theta),cy+radius*np.array(values)/5*np.sin(theta)];all=[]
 for i in range(5):
  p0,p1,p2,p3=v[(i-1)%5],v[i],v[(i+1)%5],v[(i+2)%5];c1=p1+tension*(p2-p0);c2=p2-tension*(p3-p1);u=np.linspace(0,1,501)[:,None];all.append((1-u)**3*p1+3*(1-u)**2*u*c1+3*(1-u)*u*u*c2+u**3*p2)
 return np.concatenate(all)
def min_dist(points,curve):
 # Chunked Euclidean distances; no source parameter is fitted to the output.
 return np.concatenate([np.sqrt(((points[i:i+256,None,:]-curve[None,:,:])**2).sum(axis=2)).min(axis=1)for i in range(0,len(points),256)])
results=[]
for k,color in enumerate(colors):
 dominant=(a[:,:,k].astype(int)-np.max(np.delete(a,k,axis=2),axis=2).astype(int)>40)&(a[:,:,k]>180);dominant[70:145,600:660]=False;ys,xs=np.nonzero(dominant);ink=np.c_[xs+.5,ys+.5];fits=[]
 for t in [.1,0,.05,.15,.17,.2]:
  expected=samples(vectors[k],t);d=min_dist(ink,expected);back=min_dist(expected,ink);fits.append({'fixedSourceCoefficient':t,'actualInkPixels':len(ink),'actualToExpectedMaxDistance':float(d.max()),'actualToExpectedP99Distance':float(np.quantile(d,.99)),'actualWithin2pxFraction':float((d<=2).mean()),'expectedToActualMaxDistance':float(back.max()),'expectedToActualP99Distance':float(np.quantile(back,.99))})
 results.append({'owner':'c'+str(k+1),'sourceValues':vectors[k],'strokeRGB':color.tolist(),'fixedHypothesisChecks':fits})
result={'schema':'trident-source-radar332-pixel-geometry-v1','pngSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'mappingReceiptSha256':hashlib.sha256(Path('/workspace/trident-radar-tension/docs/evidence/radar-curve-tension-2026-11-01/source-mapping.json').read_bytes()).hexdigest(),'profile':'mermaid-radar-cubic-coefficient-1fb7869-v1','independentGrayscalePlotCircle':circle,'actualDarkAxisArms':axis,'sourceAxisScaleFactor':.25,'sourceRange':[0,5],'sourceCoefficient':.1,'sourceClosedBezierFormula':'cp1=Pi+t*(Pnext-Pprev);cp2=Pnext-t*(Pnextnext-Pi)','curves':results,'scope':'Exact source vectors/range/explicit coefficient create independent expected curves from the actually measured grayscale grid. No actualSVG path/control values or fittedtension/data values are consumed. All fixed wrong-coefficient hypotheses remain recorded as controls. Actuallegend and text are independently inspected, not used as curve fit anchors. Pixel2px envelope covers subpixel stroke/raster/gridmeasurement uncertainty; no content/hash guard is weakened.','rendererInvocations':0,'codexApiInvocations':0}
(base/'radar332-pixel-measurements.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'circle':circle,'axis':axis,'curves':results}))
