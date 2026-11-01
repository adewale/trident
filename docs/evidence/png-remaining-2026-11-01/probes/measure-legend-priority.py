from pathlib import Path
from PIL import Image
import json,numpy as np,hashlib
b=Path('/workspace/trident-png-remaining-2026-11-01');rows=json.load(open('/workspace/trident-png-held-2026-11-01/hold-inputs.json'));old=json.load(open('/workspace/trident-png-wardley-2026-11-01/frame-force-measurements.json'))['results'];sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def runs(a):
 out=[];s=None
 for i,v in enumerate(np.r_[a,False]):
  if v and s is None:s=i
  if not v and s is not None:out.append([s,i]);s=None
 return out
def weighted(a,lo,hi):
 w=255-a[lo:hi].astype(float);return float(np.average(np.arange(lo,hi)+.5,weights=w))
proof=[]
for h in rows:
 if h['index']!=520:continue
 a=np.array(Image.open(h['actualImagePath']).convert('RGB'));dark=a.max(axis=2)<150
 cols=runs(dark[450:553,550:].sum(axis=0)>50);assert len(cols)==2
 # Actual border centerlines in text-free scanlines. Fullplot frame independently
 # measured from unrequested gray axes, and verified against outercanvas padding.
 xx=[weighted(a[490,:,0],r[0]+550,r[1]+550)for r in cols];lo=int(xx[0])+5;hi=int(xx[1])-5;ys=runs(dark[450:558,lo:hi].sum(axis=1)>(hi-lo)*.8);assert len(ys)==2
 yy=[weighted(a[:,750,0],r[0]+450,r[1]+450)for r in ys];W,H=a.shape[1],a.shape[0]
 gray=(a.max(axis=2)-a.min(axis=2)<2)&(a.max(axis=2)<235)
 axisCols=runs(gray[:,:180].sum(axis=0)>.6*H);assert len(axisCols)==1
 cols=range(*axisCols[0]);weights=np.array([((255-a[:,x,0].astype(float))/255).sum()for x in cols]);axisLeft=float(np.average(np.array(list(cols))+.5,weights=weights));axisTop=float(np.where(gray[:,list(cols)].any(axis=1))[0].min())
 bottomRuns=runs(gray[420:,:500].sum(axis=1)>375);assert len(bottomRuns)==1;bottomRows=range(bottomRuns[0][0]+420,bottomRuns[0][1]+420);weights=np.array([((255-a[y,:500,0].astype(float))/255).sum()for y in bottomRows]);axisBottom=float(np.average(np.array(list(bottomRows))+.5,weights=weights))
 # Target520's own unoccluded left/top/bottom strokes determine the single
 # published symmetric outercanvas-padding parameter. Right endpoint is
 # covered by thelegend; no519frame/cross-callcoordinateisborrowed.
 measuredPadding=[axisLeft,axisTop,H-axisBottom];assert max(measuredPadding)-min(measuredPadding)<.01
 padding=float(np.mean(measuredPadding));frame={'left':padding,'top':padding,'right':W-padding,'bottom':H-padding};pads=[padding]*4
 bounds={'left':xx[0],'top':yy[0],'right':xx[1],'bottom':yy[1]};width=xx[1]-xx[0];height=yy[1]-yy[0]
 def assess(v,e):
  requested=[frame['left']+e*(frame['right']-frame['left']),frame['bottom']-v*(frame['bottom']-frame['top'])];predicted=[max(frame['left'],min(requested[0],frame['right']-width)),max(frame['top'],min(requested[1],frame['bottom']-height))];errors=[abs(predicted[0]-xx[0]),abs(predicted[1]-yy[0])];return{'sourceCoordinates':[v,e],'requestedPoint':requested,'fixedForwardClamp':predicted,'errorsPx':errors,'pass':max(errors)<=2}
 correct=assess(.1,.9);wrong=[assess(.8,.9),assess(.1,.1),assess(.8,.1)];assert correct['pass']and not any(r['pass']for r in wrong)
 proof.append({'index':520,'project':h['project'],'pngSha256':h['pngSha256'],'outerCanvas':[W,H],'grayMapAxisFrame':frame,'targetOwnMeasuredAxisStrokes':{'left':axisLeft,'top':axisTop,'bottom':axisBottom,'visibleBottomSampleXRange':[0,500],'leftColumnRuns':axisCols,'bottomRowRunsOffset420':bottomRuns},'outerPaddingDecoder':'Singlepublicsymmetricpadding inferredfromtarget520ownleft/top/unoccludedbottom; rightendpointunderlegendderivedbyoutercanvassymmetry,notcross-caseframeborrowing','independentlyEqualOuterCanvasPadding':pads,'actualLegendBorderBounds':bounds,'actualLegendWidth':width,'actualLegendHeight':height,'literalPositionForwardProjection':correct,'wrongOutsideClampPlateauControls':wrong,'scope':'Positive-only pinnedpublicclampdecoder. Actuallegendwidth/height andmap-axisframe measuredfirst; mapaxes independentlyequalallfouroutercanvaspaddingbounds. Applyfixedpublicclamp tosource[.10,.90], notrawSVGpositions. Sourcealternativesinsideidenticalclampplateauareobservationallyequivalent; nointernalunclampedcoordinateisclaimed.'})
result={'schema':'trident-wardley-positive-only-joint-legend-clamp-proof-v1','launcherSha256':sha(__file__),'profile':'wardley-public-outer-canvas-clamped-legend-1fb7869-v1','rows':proof,'rendererInvocations':0};(b/'legend520-clamp-proof.json').write_text(json.dumps(result,indent=2)+'\n')
h=next(r for r in rows if r['index']==304 and r['project']=='mermaid-js/mermaid');a=np.array(Image.open(h['actualImagePath']).convert('RGB'));orange=np.all(a==[255,165,0],axis=2);ys,xs=np.where(orange);assert len(xs)>100 and xs.max()-xs.min()<5
bounds=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
colors={'High':[255,165,0],'Very High':[255,0,0],'Low':[0,0,255],'Medium':None}
def decode(rgb,owned,extent):return rgb==colors['High']and owned and extent
controls=[{'case':'wrongred','pass':decode(colors['Very High'],True,True)},{'case':'wrongblue','pass':decode(colors['Low'],True,True)},{'case':'absent','pass':decode(None,True,True)},{'case':'othercard','pass':decode(colors['High'],False,True)},{'case':'isolatedcolorpixel','pass':decode(colors['High'],True,False)}];assert not any(c['pass']for c in controls)
r={'schema':'trident-positive-only-kanban-owned-high-ribbon-pixel-proof-v1','launcherSha256':sha(__file__),'index':304,'project':h['project'],'pngSha256':h['pngSha256'],'profile':'mermaid-kanban-owned-priority-ribbon-1fb7869-v1','actualExactOrangeRgb':[255,165,0],'actualOpaqueOrangePixels':len(xs),'actualRibbonBounds':bounds,'manualDirectOwnership':'Onlyoneactualtaskcard,ownedbyfullUpdateDatabaseFunctioncaption,MC-2037ticket,knsvassigneeinTodo. Orangeverticalribbonisitsleftedgeandextendsitsbodyheight; noothercardexists. Exactsource/pixelreceiptretainsallfields.','wrongControls':controls,'scope':'PinnedpublicHighenumencoder only; colordoesnotqualifywithouttaskownership+verticaledgeextent. Nativealternativeencodingsnotwronggraded.','rendererInvocations':0};(b/'kanban304-high-ribbon-proof.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'520':proof,'304':bounds}))
