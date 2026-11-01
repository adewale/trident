from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,math
base=Path('/workspace/trident-png-held-2026-11-01');p=Path('/workspace/trident-png-full-2026-10-31/docs/png/drawings/3ab2addd3db34977f96a96e96b586089183e3fa13dec3ad9c9cd2046726039e6.png');a=np.asarray(Image.open(p).convert('RGB'));h,w,_=a.shape
nonwhite=a.min(axis=2)<250;ys,xs=np.nonzero(nonwhite);whole=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
# All three colors are measured from fully painted pixels, not SVG properties.
stroke=a[85,318].astype(float);fill=a[85,310].astype(float);white=a[85,325].astype(float);assert stroke.tolist()==[45,212,191] and fill.tolist()==[240,253,250] and white.tolist()==[255,255,255]
core=np.all(a==stroke,axis=2);cy0,cx0=np.nonzero(core);# Only the unique teal ellipse has this opaque stroke color.
assert cx0.min()>150 and cx0.max()<325 and cy0.min()>45 and cy0.max()<125
centerY=float((cy0.min()+cy0.max()+1)/2);bbox=[int(cx0.min()),int(cy0.min()),int(cx0.max())+1,int(cy0.max())+1];rows=[]
for y in [math.floor(centerY-.5),math.ceil(centerY-.5)]:
 xs=np.nonzero(core[y])[0];right=xs[xs>200];assert len(right)>=1
 lo,hi=int(right.min()),int(right.max());inner=a[y,lo-1].astype(float);outer=a[y,hi+1].astype(float)
 ai=float((fill[0]-inner[0])/(fill[0]-stroke[0]));ao=float((white[0]-outer[0])/(white[0]-stroke[0]));innerX=lo-ai;outerX=hi+1+ao;mid=(innerX+outerX)/2
 residualInner=float(np.abs((1-ai)*fill+ai*stroke-inner).max());residualOuter=float(np.abs((1-ao)*white+ao*stroke-outer).max());assert residualInner<=1 and residualOuter<=1
 rows.append({'row':y,'pureStrokeColumns':[lo,hi],'innerBlendPixel':inner.tolist(),'outerBlendPixel':outer.tolist(),'inferredInnerGeometryEdge':innerX,'inferredOuterGeometryEdge':outerX,'actualStrokeWidth':outerX-innerX,'strokeCenterlineX':mid,'maximumRGBMixtureResidual':max(residualInner,residualOuter)})
# The actual full ellipse has >=29px vertical geometry semiaxis and <=82px
# horizontal semiaxis, from its complete visible extent and measured2px stroke.
# Even a1px center-row uncertainty adds <.05px to the horizontal extremum.
maxRx=82;minRy=29;centerRowUncertainty=1;curvatureBound=maxRx*(1-math.sqrt(1-(centerRowUncertainty/minRy)**2));assert curvatureBound<.05
mixUncertainty=.03;rightUpper=max(r['strokeCenterlineX']for r in rows)+curvatureBound+mixUncertainty
bounds={'left':whole[0],'top':whole[1],'right':rightUpper,'bottom':whole[3]};clear={'left':bounds['left'],'top':bounds['top'],'right':w-bounds['right'],'bottom':h-bounds['bottom']}
assert all(v>=24 for v in clear.values())
r={'schema':'trident-usecase492-owned-canvas-geometry-v1','pngSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'width':w,'height':h,'pixelRatio':1,'wholeVisibleInkCellBounds':whole,'actualStrokeRGB':stroke.tolist(),'actualFillRGB':fill.tolist(),'actualOutsideRGB':white.tolist(),'completeOpaqueStrokeExtent':bbox,'independentEllipseCenterY':centerY,'rightEdgeSamples':rows,'curveExtremumBound':curvatureBound,'RGBMixtureGeometryUncertainty':mixUncertainty,'ownedGeometryConservativeBounds':bounds,'minimumGeometryClearances':clear,'scope':'ActualPNG owns exactly Customer actor+label, its arrow and Browse catalog ellipse+label. All rightmost ink is independently visible teal ellipse stroke, with no occlusion; remaining sides use whole-ink bounds conservatively. Inner/outer stroke interfaces and actual2px width are inferred from actualRGBcoverage mixtures, cross-channel checked, not SVGlinewidth/box metadata. The midpoint plus explicit curvature/quantization bounds is a conservative uppergeometry extent. Literal24 is compared only after measurement. PixelRatio1 and intrinsicheight172/ViewBox172 conversion bound the unit; no invisible layoutbox or exactinternalpadding inverse is inferred.','rendererInvocations':0,'codexApiInvocations':0}
(base/'usecase492-clearance-measurements.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'centerY':centerY,'rows':rows,'bounds':bounds,'clearances':clear}))
