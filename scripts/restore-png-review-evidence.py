#!/usr/bin/env python3
"""Verify one sequential archive pass, then restore unchanged logical receipts."""
import argparse,hashlib,json,os,pathlib,re,tarfile
P=pathlib.Path
p=argparse.ArgumentParser();p.add_argument('--archive',required=True);p.add_argument('--foundation',required=True);p.add_argument('--out',required=True);a=p.parse_args();out=P(a.out).resolve();foundation=P(a.foundation).resolve();sha=lambda b:hashlib.sha256(b).hexdigest()
if out.exists():raise ValueError('Restore output must be a fresh directory')
def inside(root,name):
 path=pathlib.PurePosixPath(name)
 if path.is_absolute()or'..'in path.parts or'\\'in name:raise ValueError('Archive path escapes logical root')
 target=(root/P(*path.parts)).resolve()
 if not target.is_relative_to(root):raise ValueError('Archive path escapes logical root')
 return target
def file_sha(path):
 with open(path,'rb')as file:return hashlib.file_digest(file,'sha256').hexdigest()
# Gzip seeking for each logical alias is quadratic. Read/verify each exact byte
# object once in archive order, then link logical aliases inside the fresh tree.
with tarfile.open(a.archive,'r|gz')as tar:
 first=tar.next()
 if not first or first.name!='index.json'or not first.isfile():raise ValueError('Evidence index must be the first regular archive member')
 index=json.load(tar.extractfile(first))
 if index['schema']!='trident-full-png-evidence-object-archive-v1':raise ValueError('Unknown PNG evidence archive')
 logical=[row['path']for row in index['files']]
 if len(logical)!=len(set(logical)):raise ValueError('Duplicate logical evidence path')
 expected={}
 for row in index['files']:
  inside(out,row['path'])
  if pathlib.PurePosixPath(row['path']).parts[0]in['.objects','index.json','path-map.json']:raise ValueError('Logical evidence shadows restoration metadata')
  if not re.fullmatch('[a-f0-9]{64}',row['sha256'])or not isinstance(row['bytes'],int)or row['bytes']<0:raise ValueError('Invalid evidence identity')
  if row['storage']=='archive-object':
   if row['sha256']in expected and expected[row['sha256']]!=row['bytes']:raise ValueError('One byte object has contradictory lengths')
   expected[row['sha256']]=row['bytes']
  elif row['storage']!='prior-foundation':raise ValueError('Unknown object storage')
 out.mkdir(parents=True);cache=out/'.objects';cache.mkdir();seen=set()
 while True:
  member=tar.next()
  if member is None:break
  if not member.isfile()or not re.fullmatch('objects/[a-f0-9]{64}',member.name):raise ValueError('Unexpected or nonregular archive member')
  digest=member.name.split('/')[1]
  if digest in seen or digest not in expected or member.size!=expected[digest]:raise ValueError('Duplicate/unplanned object or changed length')
  data=tar.extractfile(member).read()
  if sha(data)!=digest:raise ValueError('Archived object bytes differ')
  (cache/digest).write_bytes(data);seen.add(digest)
 if seen!=set(expected):raise ValueError('Evidence archive lacks a planned byte object')
paths={};verified={}
for row in index['files']:
 digest=row['sha256'];blob=cache/digest
 if row['storage']=='prior-foundation'and not blob.exists():
  data=inside(foundation,row['foundationPath']).read_bytes()
  if len(data)!=row['bytes']or sha(data)!=digest:raise ValueError('Published foundation reference differs')
  blob.write_bytes(data)
 if blob.stat().st_size!=row['bytes']:raise ValueError('Logical object length differs')
 target=inside(out,row['path']);target.parent.mkdir(parents=True,exist_ok=True);os.link(blob,target)
 source=row['sourcePath']
 if source in paths and verified[source]!=digest:raise ValueError('One provenance path has contradictory byte versions')
 paths.setdefault(source,row['path']);verified[source]=digest
for blob in cache.iterdir():blob.chmod(0o444)
(out/'index.json').write_text(json.dumps(index,indent=2)+'\n');(out/'path-map.json').write_text(json.dumps({'schema':'trident-png-restored-path-map-v1','archiveSha256':file_sha(a.archive),'paths':paths},indent=2)+'\n')
print(json.dumps({'restoredFiles':len(index['files']),'verifiedByteObjects':len(seen),'pathMap':str(out/'path-map.json'),'rendererInvocations':0,'codexApiInvocations':0}))
