from pathlib import Path
import json,hashlib,math,numpy as np
from PIL import Image
base=Path('/workspace/trident-png-held-2026-11-01');prior=base/'radar332-pixel-measurements.json';r=json.loads(prior.read_text());p=Path('/workspace/trident-png-full-2026-10-31/docs/png/drawings/ee004a9d7e59fe440f3b1c9bf6eeaef3abebd8a51468b0ce5cadd3b1359b0d0d.png');assert hashlib.sha256(p.read_bytes()).hexdigest()==r['pngSha256'];a=np.asarray(Image.open(p).convert('RGB'));cx,cy=r['independentGrayscalePlotCircle']['center'];radius=r['independentGrayscalePlotCircle']['radius'];vectors=[[1,2,3,4,5],[5,4,3,2,1],[3,3,3,3,3]]
def path(values,maximum):
 theta=-math.pi/2+np.arange(5)*2*math.pi/5;v=np.c_[cx+radius*np.array(values)/maximum*np.cos(theta),cy+radius*np.array(values)/maximum*np.sin(theta)];curves=[]
 for i in range(5):
  prev,here,nxt,after=v[(i-1)%5],v[i],v[(i+1)%5],v[(i+2)%5];c1=here+.1*(nxt-prev);c2=nxt-.1*(after-here);u=np.linspace(0,1,501)[:,None];curves.append((1-u)**3*here+3*(1-u)**2*u*c1+3*(1-u)*u*u*c2+u**3*nxt)
 return np.concatenate(curves)
def distance(points,curve):return np.concatenate([np.sqrt(((points[i:i+256,None,:]-curve[None,:,:])**2).sum(axis=2)).min(axis=1)for i in range(0,len(points),256)])
rows=[]
for i,values in enumerate(vectors):
 original=path(values,5);scaled=path([2*v for v in values],10);wrong=path(values,10);mask=(a[:,:,i].astype(int)-np.max(np.delete(a,i,axis=2),axis=2).astype(int)>40)&(a[:,:,i]>180);mask[70:145,600:660]=False;ys,xs=np.nonzero(mask);ink=np.c_[xs+.5,ys+.5];bad=distance(ink,wrong);difference=float(np.abs(original-scaled).max());assert difference<1e-10
 rows.append({'owner':'c'+str(i+1),'literalValues':values,'literalRange':[0,5],'wrongRangeSameValues':[0,10],'wrongRangeActualToExpectedMaxDistance':float(bad.max()),'wrongRangeActualWithin2pxFraction':float((bad<=2).mean()),'scaledValues':[2*v for v in values],'scaledRange':[0,10],'jointScalingMaximumCoordinateDelta':difference,'scaledGeometryEquivalent':True})
result={'schema':'trident-radar332-joint-range-value-controls-v1','pngSha256':r['pngSha256'],'independentGrayscalePlotCircle':r['independentGrayscalePlotCircle'],'initialMeasurementSha256':hashlib.sha256(prior.read_bytes()).hexdigest(),'launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'rows':rows,'scope':'Unprintedradialrange is observed jointly with literalvalues through normalizedgeometry, never decoded from an unlabeledring. Samevalues with wrong0..10range mustfail actualinkgeometry. Valuesandrange bothdoubled yield identicalunprintedcoordinates and remain equivalent. Source range/values are never fitted to coloredink; outerradius remains the original grayscale-only fit. No project renderer/API call.','rendererInvocations':0,'codexApiInvocations':0}
(base/'radar332-range-controls.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(rows))
