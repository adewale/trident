from pathlib import Path
import json,hashlib,shutil,datetime
root=Path(__file__).parent;original=root/'collection';target=root/'pointer-recovery';target.mkdir(exist_ok=True)
raw=(original/'raw.json').read_bytes();record=json.loads(raw)
worker=original/'community-raw/fasouto_termaid-terminal-r1-features-a1.jsonl';workerBytes=worker.read_bytes();rows=[json.loads(line)for line in workerBytes.decode().splitlines()if line.strip()]
byCase={row['workload']:row for row in rows if row.get('type')=='result'}
recovered=[]
for row in record['outputs']:
 if row.get('witness'):
  data=(original/row['witness']).read_bytes();assert hashlib.sha256(data).hexdigest()==row['sha256'];(target/row['witness']).write_bytes(data);continue
 if row['project']!='fasouto/termaid':continue
 result=byCase.get(row['caseId']);assert result and result.get('outputFile'),row['caseId']
 path=Path(result['outputFile']).resolve();assert path.is_relative_to((original/'community-raw').resolve())
 data=path.read_bytes();sha=hashlib.sha256(data).hexdigest();assert path.name.endswith(sha+'.txt')
 name=sha+'.txt';(target/name).write_bytes(data);row.update(witness=name,sha256=sha)
 recovered.append({'project':row['project'],'caseId':row['caseId'],'witness':name,'sha256':sha,'workerStatus':result['status']})
assert len(recovered)==16
record['pointerRecovery']={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalRawSha256':hashlib.sha256(raw).hexdigest(),'workerJsonlSha256':hashlib.sha256(workerBytes).hexdigest(),'scope':'Promote existing worker output paths to case witnesses after transport forwarding omitted them. Original renderer records, source references, timestamps and bytes are unchanged. No renderer or source parser invoked.','rendererInvocations':0,'rows':recovered}
(target/'raw.json').write_text(json.dumps(record,indent=2)+'\n');(target/'worker-original.jsonl').write_bytes(workerBytes)
print('Recovered exactly 16 existing Python text witnesses without renderer calls.')
