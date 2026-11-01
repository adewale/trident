from pathlib import Path
import numpy as np,json,hashlib,math
from PIL import Image
base=Path('/workspace/trident-png-held-2026-11-01');prior=base/'radar332-pixel-measurements.json';r=json.loads(prior.read_text());p=Path('/workspace/trident-png-full-2026-10-31/docs/png/drawings/ee004a9d7e59fe440f3b1c9bf6eeaef3abebd8a51468b0ce5cadd3b1359b0d0d.png');assert hashlib.sha256(p.read_bytes()).hexdigest()==r['pngSha256'];a=np.asarray(Image.open(p).convert('RGB'));cx,cy=r['independentGrayscalePlotCircle']['center'];radius=r['independentGrayscalePlotCircle']['radius'];vectors=[[1,2,3,4,5],[5,4,3,2,1],[3,3,3,3,3]]
def path(values):
 theta=-math.pi/2+np.arange(5)*2*math.pi/5;v=np.c_[cx+radius*np.array(values)/5*np.cos(theta),cy+radius*np.array(values)/5*np.sin(theta)];curves=[]
 for i in range(5):
  prev,here,nxt,after=v[(i-1)%5],v[i],v[(i+1)%5],v[(i+2)%5];c1=here+.1*(nxt-prev);c2=nxt-.1*(after-here);u=np.linspace(0,1,501)[:,None];curves.append((1-u)**3*here+3*(1-u)**2*u*c1+3*(1-u)*u*u*c2+u**3*nxt)
 return np.concatenate(curves)
def distances(points,other):return np.concatenate([np.sqrt(((points[i:i+256,None,:]-other[None,:,:])**2).sum(axis=2)).min(axis=1)for i in range(0,len(points),256)])if len(points)else np.array([])
ink=[]
for k in range(3):
 mask=(a[:,:,k].astype(int)-np.max(np.delete(a,k,axis=2),axis=2).astype(int)>40)&(a[:,:,k]>180);mask[70:145,600:660]=False;ys,xs=np.nonzero(mask);ink.append(np.c_[xs+.5,ys+.5])
expected=[path(v)for v in vectors];rows=[]
for i in range(3):
 own=distances(expected[i],ink[i]);missing=expected[i][own>2];explanations=[];qualified=np.zeros(len(missing),bool)
 for j in range(i+1,3):
  actual=distances(missing,ink[j]);predicted=distances(missing,expected[j]);owned=(actual<=2)&(predicted<=2);qualified|=owned;explanations.append({'laterSourceCurve':'c'+str(j+1),'expectedAndActualOtherCurveWithin2px':int(owned.sum())})
 rows.append({'owner':'c'+str(i+1),'predictedSamples':len(expected[i]),'directlyWithin2pxOfOwnedInk':int((own<=2).sum()),'samplesRequiringOverpaintExplanation':len(missing),'qualifiedOtherSourceCurveCoverage':int(qualified.sum()),'unexplainedMissingPredictedSamples':int((~qualified).sum()),'overpaintOwners':explanations,'unexplainedCoordinates':missing[~qualified].tolist()})
result={'schema':'trident-radar332-owned-crossing-coverage-v1','pngSha256':r['pngSha256'],'initialMeasurementSha256':hashlib.sha256(prior.read_bytes()).hexdigest(),'launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'rows':rows,'scope':'Every predictedsourcecoefficient.1 sample must have its own actualRGBcurveink within2px, or be at a literal later-source curve crossing where BOTH its independently predicted geometry and actualRGBink lie within the same2px envelope. No threshold is enlarged for a hard case; every remaining missingpoint is listed. Initial measurement already proves every actualcurveinkpixel is within2px of that curves independentlysource-computed geometry. This finite crossing test cannot excuse arbitrary opacity or unrelated occlusion.','rendererInvocations':0,'codexApiInvocations':0}
(base/'radar332-crossing-coverage.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(rows))
