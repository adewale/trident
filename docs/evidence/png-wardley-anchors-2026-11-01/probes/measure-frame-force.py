from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
base=Path('/workspace/trident-png-wardley-2026-11-01');rows=json.load(open('/workspace/trident-png-held-2026-11-01/hold-inputs.json'));results=[]
def runs(values):
 out=[];start=None
 for i,hit in enumerate(np.r_[values,False]):
  if hit and start is None:start=i
  if not hit and start is not None:out.append((start,i));start=None
 return out
for held in rows:
 if held['index']not in[519,521]:continue
 p=Path(held['actualImagePath']);a=np.asarray(Image.open(p).convert('RGB'));h,w,_=a.shape;gray=(a.max(axis=2)-a.min(axis=2)<2)&(a.max(axis=2)<235);v=gray[:,:int(.2*w)].sum(axis=0);vx=runs(v>.6*h);assert len(vx)==1;cols=range(*vx[0]);weights=np.array([((255-a[:,x,0].astype(float))/255).sum()for x in cols]);left=float(np.average(np.array(list(cols))+.5,weights=weights));ys=np.nonzero(gray[:,list(cols)].any(axis=1))[0];top=float(ys.min());horizontal=gray[int(.7*h):].sum(axis=1);hy=runs(horizontal>.75*w);assert len(hy)==1;ys2=range(hy[0][0]+int(.7*h),hy[0][1]+int(.7*h));weights=np.array([((255-a[y,:,0].astype(float))/255).sum()for y in ys2]);bottom=float(np.average(np.array(list(ys2))+.5,weights=weights));lastrow=list(ys2)[0];xx=np.nonzero(gray[lastrow])[0];right=float(xx.max()+1);frame={'left':left,'top':top,'right':right,'bottom':bottom};entry={'index':held['index'],'project':held['project'],'pngSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'frame':frame,'axisColumns':list(vx[0]),'axisRows':[list(ys2)[0],list(ys2)[-1]]}
 if held['index']==521:
  forces=[]
  for name,kind,(x0,y0,x1,y1),literal in [('AI Adoption','accelerator',(225,240,325,299),(.55,.25)),('Legacy Constraints','deaccelerator',(630,450,725,501),(.15,.75))]:
   crop=a[y0:y1,x0:x1];mask=(crop.max(axis=2)-crop.min(axis=2)<2)&(crop.max(axis=2)<185);lines=[]
   for y in range(mask.shape[0]):
    candidates=[r for r in runs(mask[y])if r[1]-r[0]>=20]
    if candidates:lines.append((y,max(candidates,key=lambda r:r[1]-r[0])))
   groups=runs(np.array([any(y==t for t,_ in lines)for y in range(mask.shape[0])]))
   assert len(groups)==2,(held['project'],name,groups,lines)
   lineData=[]
   for g in groups:
    lr=[r for y,r in lines if g[0]<=y<g[1]];lo=max(r[0]for r in lr)+4;hi=min(r[1]for r in lr)-4;assert hi-lo>=10;ink=(255-crop[g[0]:g[1],lo:hi,0].astype(float)).mean(axis=1);yc=float(np.average(np.arange(g[0],g[1])+.5,weights=ink))+y0;lineData.append({'rowRange':[g[0]+y0,g[1]+y0],'centerlineY':yc,'interiorColumns':[lo+x0,hi+x0],'leftInkColumn':min(r[0]for r in lr)+x0,'rightInkColumn':max(r[1]for r in lr)+x0})
   mid=sum(g['centerlineY']for g in lineData)/2
   if kind=='accelerator':
    shaftleft=min(g['leftInkColumn']for g in lineData);ysrange=range(int(lineData[0]['centerlineY'])+4,int(lineData[1]['centerlineY'])-3);xsrange=range(shaftleft,shaftleft+4);patch=a[list(ysrange)][:,list(xsrange),0].astype(float);weights=(255-patch).sum(axis=0);anchorX=float(np.average(np.array(list(xsrange))+.5,weights=weights));details={'verticalTailColumns':list(xsrange),'verticalTailRows':[min(ysrange),max(ysrange)]}
   else:
    shoulder=min(g['leftInkColumn']for g in lineData)+1;fits=[]
    for lo,hi in [(int(lineData[0]['centerlineY'])+3,int(mid)-2),(int(mid)+3,int(lineData[1]['centerlineY'])-2)]:
     pts=[]
     for y in range(lo,hi):
      scan=gray[y,x0:shoulder-2]&(a[y,x0:shoulder-2].max(axis=1)<185);xx=np.nonzero(scan)[0]
      if not len(xx):continue
      end=int(xx.max());start=end
      while start-1>=0 and scan[start-1]:start-=1
      values=(255-a[y,x0+start:x0+end+1,0]).astype(float);xc=float(np.average(np.arange(x0+start,x0+end+1)+.5,weights=values));pts.append((y+.5,xc))
     assert len(pts)>=4;data=np.array(pts);m,b=np.polyfit(data[:,0],data[:,1],1);fits.append({'slope':float(m),'intercept':float(b),'midlineIntersectionX':float(m*mid+b),'points':pts})
    anchorX=sum(f['midlineIntersectionX']for f in fits)/2;details={'headSlopeFits':fits}
   expected=[left+literal[1]*(right-left),bottom-literal[0]*(bottom-top)];forces.append({'name':name,'kind':kind,'sourceCoordinates':literal,'actualPredeclaredAnchor':[anchorX,mid],'sourceProjectedPoint':expected,'absoluteErrors':[abs(anchorX-expected[0]),abs(mid-expected[1])],'horizontalShaftLines':lineData,**details})
  entry['forces']=forces
 results.append(entry)
result={'schema':'trident-wardley-physical-frame-force-anchors-v1','launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'results':results,'scope':'Independent actualPNG grayaxis frame and actualpaintedforcegeometry. Forceanchor is predeclared from pinnedpublicencoding: rightarrowlefttailmidpoint / leftarrowlefttip. Horizontalshaftlines and headslopes are measured without readingSVGpositions or fitting expectedcoordinates. Defaultsizes/font/palette are not obligations. Only after measurement are literal[v,e]projected; alternativeencodings stayunknown.','rendererInvocations':0,'codexApiInvocations':0}
(base/'frame-force-measurements.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(results))
