from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
from scipy.optimize import least_squares
b=Path('/workspace/trident-png-remaining-2026-11-01');old=json.load(open('/workspace/trident-png-full-2026-10-31/c4-neutral/pixel-measurement/measurements.json'));pair=next(r for r in old['pairs']if r['index']==50);a=np.array(Image.open(pair['originalPng']).convert('RGB')).astype(float);n=np.array(Image.open(pair['neutralPng']).convert('RGB')).astype(float);caption=next(r for r in pair['captions']if r['text']=='Sends e-mails to');ra=caption['matchingCandidates'][0]['originalCrop'];rb=caption['matchingCandidates'][0]['neutralCrop'];F=68.;points=[]
# Actualonly thin stem columns on BOTH SIDES of the entireglyphunion, excluding
# body/arrow paint. A nearlyhorizontal physicalroute is sampledbycolumns.
for x in list(range(368,386))+list(range(481,491)):
 lo,hi=308,335;pix=a[lo:hi,x];gray=pix.max(axis=1)-pix.min(axis=1)<3;alpha=np.where(gray,np.clip((255-pix[:,1])/(255-F),0,1),0);mass=alpha.sum()
 if .4<mass<2:points.append([x+.5,float(np.average(np.arange(lo,hi)+.5,weights=alpha)),float(mass)])
data=np.array(points);assert len(data)>=20
# A singlefixedquadraticimplicit centerline x=A*y²+B*y+C is the published
# C4quadraticstrokeclass. Fitorthogonallyinphysicaly; nooffset/glyphdataenter.
xcenter=data[:,0].mean();ycenter=data[:,1].mean();xx=data[:,0]-xcenter;yy=data[:,1]-ycenter
initial=np.polyfit(xx[::2],yy[::2],2)
# Bounded second-degree y(x) is validated on interleaved independentstemrows;
# maxcurvatureerror overthismildarc is separatelyreported,notassumedzero.
coef=np.polyfit(xx[::2],yy[::2],2);width=float(np.median(data[::2,2]));test=data[1::2];centerResidual=float(np.max(np.abs(np.polyval(coef,test[:,0]-xcenter)+ycenter-test[:,1])));hold=[]
for x,y,m in test:
 col=int(x);yc=np.polyval(coef,x-xcenter)+ycenter;ys=np.arange(308,335);coverage=np.maximum(0,np.minimum(ys+1,yc+width/2)-np.maximum(ys,yc-width/2));pred=255-(255-F)*coverage;hold.extend(abs(pred-a[ys,col,1])/(255-F))
mae=float(np.mean(hold));qualified=centerResidual<=.5 and mae<=.04
# Actualcroppaircommonoverlap contains no chromaticbodypaint: independently
# checked in both originals before any glyph correspondence/translationtest.
overlap=[max(ra[0],rb[0]),max(ra[1],rb[1]),min(ra[2],rb[2]),min(ra[3],rb[3])];x0,y0,x1,y1=overlap;chromatic=int(np.maximum(a[y0:y1,x0:x1].max(axis=2)-a[y0:y1,x0:x1].min(axis=2),n[y0:y1,x0:x1].max(axis=2)-n[y0:y1,x0:x1].min(axis=2)).max());qualified=qualified and chromatic<=2
back=np.ones_like(a)*255
# Directactualstationarybackdrop from the OTHER actual image wherever the
# captioncrops do not overlap; noexpectedfont shape/sourceoffsetsupplybackground.
back[ra[1]:ra[3],ra[0]:ra[2]]=n[ra[1]:ra[3],ra[0]:ra[2]];back[rb[1]:rb[3],rb[0]:rb[2]]=a[rb[1]:rb[3],rb[0]:rb[2]]
for x in range(x0,x1):
 yc=np.polyval(coef,x+.5-xcenter)+ycenter;ys=np.arange(y0,y1);coverage=np.maximum(0,np.minimum(ys+1,yc+width/2)-np.maximum(ys,yc-width/2));back[ys,x]=(255-(255-F)*coverage)[:,None]
def alpha(img,rect):
 x0,y0,x1,y1=rect;B=back[y0:y1,x0:x1];I=img[y0:y1,x0:x1];d=B-F;den=(d*d).sum(axis=2);return np.clip(((B-I)*d).sum(axis=2)/np.maximum(den,1),0,1),den>100
q,qvalid=alpha(a,ra);trials=[]
for dx in range(43,48):
 for dy in range(-2,3):
  target=[ra[0]+dx,ra[1]+dy,ra[2]+dx,ra[3]+dy];v,vvalid=alpha(n,target);valid=qvalid&vvalid;mass=np.maximum(q,v);error=float(np.abs(q-v)[valid].sum()/max(1,mass[valid].sum()));trials.append({'dx':dx,'dy':dy,'weightedInkError':error,'visibleUnionMass':float(mass[valid].sum()),'unknownUnionMass':float(mass[~valid].sum()),'activePixels':int(((mass>.08)&valid).sum())})
trials.sort(key=lambda r:r['weightedInkError']);best=trials[0];passed=qualified and best['weightedInkError']<=.06 and best['unknownUnionMass']<=.1*(best['visibleUnionMass']+best['unknownUnionMass'])
r={'schema':'trident-c4-overlapping-caption-independent-backdrop-proof-v1','launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'index':50,'project':pair['project'],'originalPngSha256':pair['originalPngSha256'],'neutralPngSha256':pair['neutralPngSha256'],'independentBackgroundFit':{'outsideGlyphPhysicalStemSamples':points,'columnCenteredAt':xcenter,'physicalYCenteredAt':ycenter,'quadraticYofXCoefficients':coef.tolist(),'crossSectionMass':width,'heldoutMaxCenterResidualPx':centerResidual,'heldoutNormalizedFullColumnMAE':mae,'overlapChromaticDifferenceMax':chromatic,'qualified':bool(qualified)},'allTranslationTrials':trials,'bestIndependentPixelTranslation':best,'sameUnchangedRegistration':pair['registration'],'sourceOffsetComparedOnlyAfterMeasurement':[-45,0],'profileQualified':bool(passed),'scope':'Original.06weighted-inkgatepreserved. Backdropmeasuredfromactualstationarycounterimageoutsideoverlap; overlaponlysource-independentthinroutefitonvisiblephysicalcolumnsoutsidebothglyphcrops. No glyphdeletion, sourceoffsetfitting, SUTSVGgeometryornewrenderer call. If fit/holdout/ink gatesfail,thepriorunknownremains.','rendererInvocations':0};(b/'c4-50-caption-overlap-proof.json').write_text(json.dumps(r,indent=2,default=float)+'\n');print(json.dumps({'fit':r['independentBackgroundFit'],'best':best,'qualified':bool(passed)},default=float))
