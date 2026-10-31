#!/usr/bin/env python3
"""Package retained PNG evidence without a renderer, API, or rewritten receipt.

Objects are deduplicated by exact bytes, including references to the already
published immutable foundation. The index preserves every logical/source path;
call timestamps and original receipt bytes are never manufactured or restamped.
"""
import argparse,glob,hashlib,io,json,os,pathlib,tarfile
P=pathlib.Path
p=argparse.ArgumentParser();p.add_argument('--workspace',default='/workspace');p.add_argument('--out',required=True);p.add_argument('--foundation',required=True);p.add_argument('--foundation-commit',default='79777b7');args=p.parse_args();ws=P(args.workspace).resolve();foundation=P(args.foundation).resolve();out=P(args.out).resolve();sha=lambda data:hashlib.sha256(data).hexdigest()
foundation_by_sha={}
for file in sorted(foundation.rglob('*')):
 if file.is_file() and not file.is_symlink():foundation_by_sha.setdefault(sha(file.read_bytes()),str(file.relative_to(foundation)))
files={}
def add(file,logical=None):
 file=P(file)
 if not file.is_file() or file.is_symlink():return
 resolved=file.resolve()
 if not resolved.is_relative_to(ws):raise ValueError('Evidence source escapes workspace: '+str(file))
 name=logical or 'workspaces/'+str(file.relative_to(ws));data=file.read_bytes();digest=sha(data)
 if name in files and files[name]['sha256']!=digest:raise ValueError('Logical evidence path collision: '+name)
 files[name]={'path':name,'sourcePath':str(file),'sha256':digest,'bytes':len(data),'storage':'prior-foundation'if digest in foundation_by_sha else'archive-object',**({'foundationPath':foundation_by_sha[digest]}if digest in foundation_by_sha else{})}
 return data
# Actual raw collector units, same-call SVGs, modern/native companion receipts,
# producer proofs, immutable native-size images and all review histories.
for root in sorted(ws.glob('trident-png-*-2026-10-31')):
 if not root.is_dir() or root.is_symlink():continue
 for file in sorted(root.rglob('*')):
  if not file.is_file() or file.is_symlink() or '__pycache__'in file.parts:continue
  if any(part in ['node_modules','.git']for part in file.parts):continue
  if file.name.endswith('.materialized.json')or '.materialized.json.'in file.name:continue
  if file.name.startswith('reviews-0-')and file.suffix=='.json':continue
  if file.name.startswith('authoring-contracts')and file.suffix=='.json':continue
  if file.suffix in ['.png','.json','.jsonl','.gz','.ts','.py','.log','.md','.txt','.svg']:add(file)
# Original image bytes are separate from inspection-packet encoding. Preserve
# every reviewed original, including old bytes superseded by the69 changed PNGs.
manifest=ws/'trident-png-image-review-2026-10-31/manifest.json'
for entry in json.loads(manifest.read_text()):
 for image in entry['images'].values():
  if image.get('path'):add(image['path'])
old=ws/'trident-ecosystem-2026-10-31-campaign/docs/png'
for file in [old/'context.json',old/'checkpoint.json',old/'checkpoint.jsonl.gz',old/'transport-pub%3Amermaid_flutter-r1.json',old/'community-prepared.json']:
 add(file)
for pattern in ['community-raw/pub_mermaid_flutter-png-r1-features-a1*']:
 for file in old.glob(pattern):add(file)
raw=old/'community-raw/pub_mermaid_flutter-png-r1-features-a1.jsonl'
if raw.exists():
 for line in raw.read_text().splitlines():
  if line.strip():
   row=json.loads(line)
   for key in ['png','firstPng']:
    if row.get(key):add(row[key])
# Sealed source inventory and source/artifact ownership metadata; native binary
# or system font bytes are not redistributed by this content evidence archive.
for file in [ws/'trident-ecosystem-2026-10-31-campaign/docs/inventory.json',ws/'trident-brand-split-review/prepared/native-launch.json',ws/'trident-native-per-call-2026-10-31/prepared/native-launch.json',ws/'trident-native-verification-2026-10-29/setup/pub-cache/hosted/pub.dev/mermaid_flutter-0.3.2/LICENSE']:
 add(file)
canonical=ws/'trident-qualification'
for file in [canonical/'corpus/docs-reviewed.json',canonical/'corpus/docs-source-registry.json',canonical/'corpus/docs-source-inventory.json.gz',canonical/'docs/evidence/source-theme-policy.json',canonical/'docs/source-theme-policy.md']:
 add(file,'canonical/'+str(file.relative_to(canonical)))
for file in (canonical/'qualification/source-audits').glob('*.json'):
 add(file,'canonical/'+str(file.relative_to(canonical)))
repo=ws/'trident-png-qualification'
for file in [repo/'LICENSE',repo/'corpus/docs-assets/mermaid-favicon.svg',repo/'corpus/docs-assets/MERMAID-LICENSE',repo/'corpus/docs-assets.json',repo/'scripts/package-png-review-evidence.py',repo/'scripts/restore-png-review-evidence.py']:
 add(file,'source/'+str(file.relative_to(repo)))
for file in (repo/'docs/evidence/png-full-corpus-2026-10-31').glob('*'):
 if file.is_file():add(file,'source/'+str(file.relative_to(repo)))
# Hash-only system-font provenance is retained; no host font binaries are shipped.
for file in sorted(P('/usr/share/doc').glob('fonts*/copyright')):
 if file.is_file() and not file.is_symlink():
  data=file.read_bytes();logical='licenses/system-font-packages/'+file.parent.name+'-copyright';files[logical]={'path':logical,'sourcePath':str(file),'sha256':sha(data),'bytes':len(data),'storage':'archive-object'}
index={'schema':'trident-full-png-evidence-object-archive-v1','literalDocumentationOccurrences':548,'sourcePin':'1fb7869866dd619168d840291c9c54b4f129758b','sourceLicense':'MIT','foundation':{'gitCommit':args.foundation_commit,'path':'qualification-evidence','scope':'Already published56-case/package/timing evidence; unchanged bytes referenced rather than duplicated.'},'scope':'Retained actual source/PNG/image-review and same-callSVG evidence; all raw review history preserved. Flat correctness needs the selected current source/image hash receipts. No renderer, API, comparative timing, synthetic baseline or automated content approval is performed by packaging. Original filesystem paths are provenance; extract logical paths through this index. Systemfontbytes/nativeengines are not redistributed.','files':[files[k]for k in sorted(files)]}
objects={}
for row in index['files']:
 if row['storage']=='archive-object':objects.setdefault(row['sha256'],row['sourcePath'])
def put(tar,name,data):
 item=tarfile.TarInfo(name);item.size=len(data);item.mode=0o644;item.mtime=0;tar.addfile(item,io.BytesIO(data))
index_bytes=(json.dumps(index,ensure_ascii=False,indent=2)+'\n').encode();pending=P(str(out)+'.pending')
with tarfile.open(pending,'w:gz',compresslevel=6)as tar:
 put(tar,'index.json',index_bytes)
 for digest,path in sorted(objects.items()):
  data=P(path).read_bytes()
  if sha(data)!=digest:raise ValueError('Evidence changed during packaging: '+path)
  put(tar,'objects/'+digest,data)
os.replace(pending,out)
# Verify every archived object, then every logical reference, including exact
# prior-foundation bytes. Verification does not mutate raw receipts or paths.
with tarfile.open(out,'r:gz')as tar:
 actual={member.name.removeprefix('objects/'):sha(tar.extractfile(member).read())for member in tar.getmembers()if member.name.startswith('objects/')}
 if set(actual)!=set(objects)or any(key!=value for key,value in actual.items()):raise ValueError('Packaged object verification failed')
for row in index['files']:
 if row['storage']=='prior-foundation'and sha((foundation/row['foundationPath']).read_bytes())!=row['sha256']:raise ValueError('Published foundation byte reference changed')
summary={'schema':'trident-png-evidence-archive-manifest-v1','archive':out.name,'archiveSha256':sha(out.read_bytes()),'archiveBytes':out.stat().st_size,'indexSha256':sha(index_bytes),'logicalFiles':len(files),'newByteObjects':len(objects),'newObjectBytes':sum(P(path).stat().st_size for path in objects.values()),'priorFoundationReferences':sum(row['storage']=='prior-foundation'for row in index['files']),'foundationGitCommit':args.foundation_commit,'sourcePin':index['sourcePin'],'rendererInvocations':0,'codexApiInvocations':0,'verification':'Every archived object SHA and every prior-foundation reference was re-read and matched; original review/call receipt bytes preserved.'}
P(str(out)+'.manifest.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
