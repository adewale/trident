"""Independent campaign validation, including byte-to-pixel and score reduction."""
from pathlib import Path
import json,hashlib,collections,math,statistics
from PIL import Image, ImageChops
base=Path('/workspace/seven-png-campaign');summary=json.loads((base/'summary.json').read_text());review=json.loads((base/'review.json').read_text());checks=0;files=0;cache={};problems=[]
def check(ok,detail):
 global checks
 checks+=1
 if not ok:problems.append(detail)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for name,phase in [('qualification-client','qualification'),('measurement','measure'),('coverage-final','coverage')]:
 run=base/name;context=json.loads((run/'context.json').read_text());rows=[json.loads(l) for l in (run/'rows.jsonl').open()];check(json.loads((run/'completed.json').read_text())['complete'],name+' incomplete')
 for source in context['sources']:
  p=run/'source'/source['file'].replace('/','__');check(digest(p)==source['sha256'],name+' source '+source['file'])
 for r in rows:
  if r.get('png'):
   p=run/r['png'];b=p.read_bytes();encoded=hashlib.sha256(b).hexdigest();files+=1
   if encoded not in cache:
    image=Image.open(p).convert('RGBA');red,green,blue,_=image.split();minimum=ImageChops.darker(ImageChops.darker(red,green),blue);bounds=minimum.point(lambda x:255 if x<245 else 0).getbbox();cache[encoded]={'size':image.size,'sha':hashlib.sha256(image.tobytes()).hexdigest(),'opaque':image.getextrema()[3]==(255,255),'ink':bounds}
   image=cache[encoded]
   if r['status']=='ok':
    check(image['ink'] is not None and image['ink'][0]>=30 and image['ink'][1]>=30 and image['ink'][2]<=1170 and image['ink'][3]<=870,name+' margin/ink '+r['id']);check(encoded==r['inspection']['encodedSha256'],name+' encoded identity '+r['id']);check(image['size']==(1200,900),name+' dimensions '+r['id']);check(image['opaque'],name+' opacity '+r['id']);check(image['sha']==r['inspection']['pixelSha256'],name+' pixel identity '+r['id'])
    check(len(b)==r['bytes'],name+' byte count '+r['id'])
    if name=='measurement':
     check(image['sha']==review['cases'][r['case']]['pixels'][r['participant']],name+' reviewed output '+r['id'])
  if name=='measurement' and r['status']=='ok':
   check(math.isclose(r['apiMs']+r['normalizationMs'],r['renderWorkMs'],abs_tol=1e-6),name+' stage sum '+r['id'])
   check(r['totalMs']>=r['renderWorkMs']-.001,name+' client completion '+r['id'])
   check(r['clientBinaryDecodeMs']>=0,name+' client decoding '+r['id'])
 if name=='measurement':
  measured=[r for r in rows if r['phase']=='measure'];check(len(measured)==20*7*13*3,'measured sample count');check(all(r['status']=='ok' for r in rows),'unexpected measured/warmup failure')
  for p in [x['id'] for x in context['participants']]:
   for block in range(1,21):
    for c in summary['commonCases']:
     selected=[r for r in measured if (r['participant'],r['block'],r['case'])==(p,block,c)];check(len(selected)==3,'cell sample count')
  for result in summary['ranked']:
   perlaunch=[]
   for block in range(1,21):
    medians=[]
    for case in summary['commonCases']:
     values=sorted(r['totalMs'] for r in measured if r['participant']==result['participant'] and r['block']==block and r['case']==case);medians.append(values[1])
    perlaunch.append(math.prod(x**(1/len(medians)) for x in medians))
   independent=math.prod(x**(1/len(perlaunch)) for x in perlaunch)
   check(math.isclose(independent,result['geometricMs'],rel_tol=1e-12),result['participant']+' independent geometric score')
  snapshots=[json.loads(l) for l in (run/'isolation.jsonl').open()];check(len(snapshots)==20*7*3,'isolation snapshots')
  for snap in snapshots:
   check(snap['cpuset']=='2' and snap['quota']=='100000 100000' and snap['memory']=='17179869184','kernel limits')
   check(all(t['affinity']=='2' for t in snap['threads']),'thread escaped')
result={'checks':checks,'differences':problems,'pngFilesReconciled':files,'distinctEncodedStreamsDecodedByPillow':len(cache),'allScoresIndependentlyAgree':not problems,'scope':'Raw file, PNG, reviewed pixel, stage/clock, block/sample and independent score audit. Primary bootstrap uses declared paired launch blocks; this audit does not import its reducer.'}
(base/'audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));assert not problems
