from pathlib import Path
from PIL import Image
import hashlib,json
p=Path('/workspace/trident-png-full-2026-10-31/docs/png/drawings/d2e119f9f9ad827fe85e72b8f729270ca82174c47b8e7e0a56312c24bbeb82e1.png');image=Image.open(p).convert('RGBA');green=lambda x,y:(lambda p:p[1]==255 and p[0]<250 and p[2]<250 and p[3]==255)(image.getpixel((x,y)))
# Each sample lies on the independently visible vertical stem at successive
# tree depths, away from horizontal branch junctions and red label ink.
samples=[]
for name,y in [('implicit-root-stem',40),('packages-child-stem',70),('mermaid-child-stem',102)]:
 runs=[];start=None
 for x in range(image.width+1):
  hit=x<image.width and green(x,y)
  if hit and start is None:start=x
  if not hit and start is not None:runs.append([start,x-1]);start=None
 if not runs:raise ValueError('No actual green stem sample')
 run=runs[-1];weights=[1-image.getpixel((x,y))[0]/255 for x in range(run[0],run[1]+1)];width=sum(weights);center=sum(x*a for x,a in zip(range(run[0],run[1]+1),weights))/width;samples.append({'owner':name,'row':y,'allGreenRuns':runs,'selection':'Rightmost independently visible depth stem on this row','inkColumns':run,'width':width,'center':center})
steps=[samples[i+1]['center']-samples[i]['center']for i in range(2)]
assert all(abs(step-85)<.0001 for step in steps) and all(abs(s['width']-3)<.01 for s in samples)
red=[]
for text,(y0,y1)in [('packages',(33,61)),('mermaid',(65,93)),('src',(97,125)),('parser',(129,157))]:
 points=[(x,y)for y in range(y0,y1)for x in range(image.width)if image.getpixel((x,y))==(255,0,0,255)]
 red.append({'label':text,'solidRedInkBounds':[min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points)]})
r={'schema':'trident-tree463-visible-level-geometry-v1','pngSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'pngDimensions':list(image.size),'launcherSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'greenStemSamples':samples,'adjacentDepthStepsPixels':steps,'configuredRowIndent':80,'independentlyObservedStrokeThicknessPixels':3,'redLabelBounds':red,'sourceBasis':'Pinned publicTreeView schema2824: rowIndent is Horizontal distance between rows differing by one level. paddingX is separately Horizontal padding of label. Neither grants adding default5 to the authored level distance. Root/source owner independently confirmed this reading. The actual raster is1pixel perSVGunit from the owned160high intrinsic/viewBox frame; font20 matching independently corroborates this scale.','scope':'Pure actualPNG color/geometry samples. Stem owners/depths are independently visible in the native-size tree. No renderer or existingSVGdeclared position supplies the measured85pxsteps; the ownedSVG only supplies a separately audited unit-to-raster registration. Source80 is compared after measurement; no expected-value fitting. Extra implicit root is retained as a conventional tree root, not counted as an authored missing/extra node.','rendererInvocations':0,'codexApiInvocations':0}
Path('/workspace/trident-png-held-2026-11-01/tree-indent-measurements.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'steps':steps,'strokeWidths':[s['width']for s in samples],'redLabelBounds':red}))
