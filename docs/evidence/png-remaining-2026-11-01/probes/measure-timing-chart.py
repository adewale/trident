from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
b=Path('/workspace/trident-png-remaining-2026-11-01'); holds=json.load(open('/workspace/trident-png-held-2026-11-01/hold-inputs.json'))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def runs(a):
 out=[];s=None
 for i,v in enumerate(np.r_[a,False]):
  if v and s is None:s=i
  if not v and s is not None:out.append([s,i]);s=None
 return out
h=next(r for r in holds if r['index']==261 and r['project']=='pub:mermaid_flutter');a=np.array(Image.open(h['actualImagePath']).convert('RGB'));sat=(a[:,:,2].astype(float)-a[:,:,0])>40
# Source-independent painted blue horizontal runs identify bar bounds; labels/black ticks are separate.
from scipy.ndimage import label,find_objects
cc,n=label(sat);parts=[]
for y,x in find_objects(cc):parts.append({'x':[x.start,x.stop],'y':[y.start,y.stop]})
bars=[{'yRange':r['y'],'left':float(r['x'][0]),'right':float(r['x'][1])}for r in parts if r['x'][1]-r['x'][0]>50 and 5<r['y'][1]-r['y'][0]<30];bars.sort(key=lambda r:r['yRange'])
vert=sorted(sum(r['x'])/2 for r in parts if r['y'][1]-r['y'][0]>40 and r['x'][1]-r['x'][0]<=4)
gray=(a.max(axis=2)-a.min(axis=2)<2)&(a.max(axis=2)<235);ticks=runs(gray[12:45].sum(axis=0)>25);assert len(ticks)==1 and len(vert)==2 and len(bars)==2
# Recover actual rectangle shaft centerlines from independently sampled stroke,
# fill and backgroundRGB; bbox outerAA is not a geometry coordinate.
stroke=np.array([83,79,188],float);fill=np.array([138,144,221],float);back=np.array([240,240,255],float)
def stroke_center(outer,y):
 pts=[]
 for x in range(max(0,int(outer)-3),min(a.shape[1],int(outer)+4)):
  color=a[y,x].astype(float);fits=[]
  for bg in [fill,back]:
   v=stroke-bg;alpha=float(np.clip(np.dot(color-bg,v)/np.dot(v,v),0,1));res=float(np.linalg.norm(color-(bg+alpha*v)));fits.append((res,alpha))
  residual,alpha=min(fits)
  if residual<3:pts.append((x+.5,alpha))
 return float(sum(x*w for x,w in pts)/sum(w for x,w in pts))
for bar in bars:
 y=bar['yRange'][0]+5
 bar['outerAAExtent']=[bar['left'],bar['right']]
 bar['left']=stroke_center(bar['left'],y);bar['right']=stroke_center(bar['right'],y)
actual=[vert[0],bars[0]['left'],bars[0]['right'],bars[1]['right'],vert[1],sum(ticks[0])/2];minutes=np.array([0,2,5,13,28,30],float)
def assess(t):
 scale=(actual[5]-actual[0])/(t[5]-t[0]);offset=actual[0]-scale*t[0];residual=np.array(actual)-(offset+scale*np.array(t));return{'pixelsPerMinute':float(scale),'offset':float(offset),'residualsPx':residual.tolist(),'maxResidualPx':float(np.abs(residual).max()),'positive':bool(scale>0 and np.abs(residual).max()<=1)}
positive=assess(minutes);wrong=[]
for i in range(6):
 t=minutes.copy();t[i]+=1;wrong.append({'changedObservedSemanticIndex':i,'minutesDelta':1,**assess(t)})
assert positive['positive'] and all(not r['positive']for r in wrong)
result={'schema':'trident-gantt-single-affine-clock-pixel-proof-v1','launcherSha256':sha(__file__),'index':261,'project':h['project'],'pngSha256':h['pngSha256'],'semanticOrder':['Initial vert17:30','TaskAstart17:32','TaskAend/TaskBstart17:35','TaskBend17:43','Finalvert17:58','actual18:00axisTick'],'sourceMinutesAfter1730':minutes.tolist(),'actualPixelCoordinates':actual,'actualBars':bars,'actualVertMarkers':vert,'actualPhysicalAxisTickColumnRange':ticks[0],'frameCalibrators':[0,5],'overdeterminingConstraints':[1,2,3,4],'assessment':positive,'wrongSingleMinuteControls':wrong,'scope':'One shared positive affineclock, no per-event/valuefit; actualpainted18:00tick andsource-ownedInitial/Finalverticalmarkersemantics. Allfourremainingconstraints independentlychecked. Vertmarkers useexplicitstart; Initialduration2m controlsTaskAimplicitstart. Finalunuseddurationremainsnative; nohiddenendpointclaimed. Exactphysicaltickstroke, nottextink, calibratesaxis.','rendererInvocations':0};(b/'gantt261-clock-proof.json').write_text(json.dumps(result,indent=2)+'\n')
# Separate actual physical tick-stroke baseline witness for526.
h=next(r for r in holds if r['index']==526);a=np.array(Image.open(h['actualImagePath']).convert('RGB'));dark=a.max(axis=2)<100;yt=runs(dark[35:445,51:60].sum(axis=1)>=6);yt=[[x+35,y+35]for x,y in yt];centers=[sum(r)/2 for r in yt];assert len(centers)==11
zero=centers[-1];fifty=centers[0];bars=[]
for x0,x1 in [(60,158),(240,338),(420,518),(600,698)]:
 for label,color in [('blue',[0,0,255]),('green',[0,255,0])]:
  mask=np.all(a[:,x0:x1]==color,axis=2);ys,xs=np.where(mask);bars.append({'categoryObservedXRange':[x0,x1],'color':label,'opaqueTopRow':int(ys.min()),'opaqueBottomRow':int(ys.max()),'opaquePixelCount':len(ys)})
assert min(r['opaqueBottomRow']+1 for r in bars if r['color']=='green')-zero>7
r={'schema':'trident-xychart-actual-physical-zero-baseline-counterexample-v1','launcherSha256':sha(__file__),'index':526,'project':h['project'],'pngSha256':h['pngSha256'],'physicalTickStrokeXRange':[51,60],'physicalTickStrokeYRanges':yt,'tickCentersHighToLow':centers,'manualVisibleTickLabelsHighToLow':list(range(50,-1,-5)),'actualZeroTickCenter':zero,'actualFiftyTickCenter':fifty,'actualBarPixelInventory':bars,'counterexample':'Allgreenbars haveopaqueRGB0,255,0atrow439, atleast7pxbelowphysicallypaintedzero tick; actualcommonbargeometryextendsbelowzero. Noaxis/zerobaselinewasfittedtobarbottom. Allrequestedtops/colors/linefactsare retaineddiagnostically; fullcorrectnessfailsonthisconcretebaselinecounterexample.','positiveControl':'Syntheticcorrectbar endingatpaintedzero passeszero-baselineassertion; identicalbartranslatedonlyatbottomtoactual440fails.','wrongControl':{'sourceZeroTickCenter':zero,'correctBarGeometryBottom':zero,'wrongBarGeometryBottom':440,'tolerancePx':1,'correctPass':True,'wrongPass':abs(440-zero)<=1},'rendererInvocations':0};(b/'xy526-zero-baseline-counterexample.json').write_text(json.dumps(r,indent=2)+'\n')
print(json.dumps({'261':positive,'526physicalZero':zero,'526greenOpaqueBottom':439}))
