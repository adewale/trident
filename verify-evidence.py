"""Independent admission receipt/archive checks; no renderer or timer executes."""
from pathlib import Path
import hashlib,io,json,tarfile
from PIL import Image,ImageStat
root=Path(__file__).parent
sha=lambda value:hashlib.sha256(value).hexdigest()
archive=json.load(open(root/'archive.json'));encoded=(root/archive['file']).read_bytes()
assert len(encoded)==archive['bytes'] and sha(encoded)==archive['sha256']
checks=0
with tarfile.open(fileobj=io.BytesIO(encoded),mode='r:xz') as tar:
 def read(path):return tar.extractfile('evidence/'+path).read()
 def load(path):return json.loads(read(path))
 index=load('checksums.json')
 assert len({f['path']for f in index})==len(index)
 assert {m.name for m in tar.getmembers()if m.isfile()}=={'evidence/'+f['path']for f in index}|{'evidence/checksums.json'}
 for f in index:
  value=read(f['path']);assert len(value)==f['bytes'] and sha(value)==f['sha256'];checks+=1
 summary=load('summary.json');prepared=load('prepared/prepared.json')[0];manifest=load('prepared/native-launch.json')
 assert prepared['node']['id']==summary['project']=='orestesgaolin/mermaid'
 assert prepared['node']['benchmark']['outputs']==['png']
 assert prepared['artifact']['version']==manifest['version']==summary['version']=='0.3.2'
 assert sha(read('prepared/prepared.json'))==summary['preparedManifestSha256']
 assert sha(read('prepared/native-launch.json'))==summary['launchManifestSha256']
 native=Path(manifest['executable']).parent
 for file in manifest['files']:assert sha(read('bundle/'+str(Path(file['path']).relative_to(native))))==file['sha256'];checks+=1
 images=0
 for run in summary['attempts']:
  phase=run['attempt'];report=load(phase+'/report.json');p=report['projects'][0];o=p['outputs'][0]
  assert sha(read(phase+'/report.json'))==run['reportSha256']
  assert o['plannedInputs']==o['passed']==6 and o['controlCounts']==dict(planned=2,passed=2,failed=0,blocked=0,missing=0)
  assert len(o['observations'])==6 and len(o['controls'])==2 and o['controlState']=='verified'
  assert all(r['metrics']['qualification']=='decoded-raster-content' and 'samplesMs'not in r and 'firstMs'not in r['metrics']for r in o['observations'])
  rawfiles=[f['path']for f in index if f['path'].startswith(phase+'/')and f['path'].endswith('/raw.jsonl')];assert len(rawfiles)==1
  raw=rawfiles[0];directory=str(Path(raw).parent);runtime=load(directory+'/runtime.json');launch=load(directory+'/launch.json')
  assert runtime['release']is True and runtime['packageVersion']=='0.3.2' and runtime['pixelRatio']==1 and runtime['startupExcludedFromApiClocks']is True
  assert runtime['entrypoint']==manifest['entrypoint']=='mermaid_flutter.renderToPng'
  assert launch['executable']==manifest['executable'] and launch['sha256']==sha(read('bundle/native_bench')) and launch['libappSha256']==sha(read('bundle/lib/libapp.so'))
  rows=[json.loads(line)for line in read(raw).splitlines()];assert len(rows)==8
  qualified={r['workload']:r for r in [json.loads(line)for line in read(directory.removesuffix('.native')).splitlines()]};assert len(qualified)==8
  expected={w['id']for w in report['workloads']+report['negativeControls']};assert {r['workload']for r in rows}==expected
  for sequence,r in enumerate(rows):
   assert r['sequence']==sequence and r['release']is True
   if r['workload'].startswith('support:negative-'):assert r['status']=='error'and r['rejected']is True and r['failureStage']=='public-api'
   else:
    assert r['status']=='ok'and qualified[r['workload']]['qualificationScope']=='decoded-raster-content'and qualified[r['workload']]['qualification']['ok']is True
    for key in ['png','firstPng']:
     path=phase+'/'+str(Path(r[key]).relative_to('/workspace/trident-native-verification-2026-10-29/'+phase))
     with Image.open(io.BytesIO(read(path)))as im:
      im.load();assert min(im.size)>0 and im.width*im.height<=16000000
      rgba=im.convert('RGBA');rgb=Image.new('RGB',im.size,'white');rgb.paste(rgba,mask=rgba.getchannel('A'));assert max(ImageStat.Stat(rgb).var)>0.1
     images+=1
   checks+=1
 conflict=load('conflicting-executable/report.json')['projects'][0]
 assert conflict['state']=='blocked'and not conflict['outputs'] and 'Ambient native executable differs'in str(conflict['gaps'])
 assert not any(f['path'].startswith('conflicting-executable/') and '.native/'in f['path']for f in index)
 assert images==summary['pngFilesIndependentlyDecoded']==24
print(json.dumps({'checks':checks,'pngFiles':images,'attempts':2,'positivePerAttempt':'6/6','controlsPerAttempt':'2/2','ambientConflict':'blocked before launch'},indent=2))
