"""Recover existing output evidence after the collector's final assessor rejected its targeted cohort.
No renderer/reference invocation. Missing transport observations and original clocks stay unknown.
"""
from pathlib import Path
import hashlib,json,datetime

root=Path('/workspace/trident-ecosystem-2026-10-31-campaign/terminal-repair')
original=root/'collection'
recovered=root/'recovery'
recovered.mkdir(exist_ok=False)
runner=Path('/workspace/trident-terminal-preparation-repair')
read=lambda p:json.loads(p.read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
prepared=read(original/'community-prepared.json')
corpus=read(runner/'corpus/terminal-project-examples.json')
cases=corpus['cases']
reference_path=Path('/workspace/trident-ecosystem-2026-10-31-terminal-full/raw.json')
reference=read(reference_path)
assert reference['corpusSha256']==sha((runner/'corpus/terminal-project-examples.json').read_bytes())
assert reference['inventory']==[[c['id'],c['sourceSha256']] for c in cases]
worker_path=original/'community-raw/crafter-station_mermaid-terminal-r1-attempt1.json'
job_path=original/'community-raw/crafter-station_mermaid-terminal-r1-attempt1.job.json'
worker=read(worker_path)
assert worker['status']=='completed' and len(worker['rows'])==120
job=read(job_path)
assert {c['id']:sha(c['source'].encode()) for c in job['workloads']}=={c['id']:c['sourceSha256'] for c in cases}
worker_rows={x['id']:x for x in worker['rows']}
outputs=[];observations=[];copied=[]
for peer in prepared:
    project=peer['node']['id']
    for case in cases:
        cid=case['id']; raw=worker_rows[cid] if project=='crafter-station/mermaid' else None
        file=Path(raw['outputFile']) if raw and raw.get('outputFile') else original/'failure-outputs'/f"{project.replace('/','_')}--{cid.replace(':','_')}.txt" if raw is None else None
        file=file if file and file.is_file() else None
        witness=None;digest=None
        if file:
            file.resolve().relative_to(original.resolve())
            data=file.read_bytes();digest=sha(data);witness=digest+'.txt'
            (recovered/witness).write_bytes(data)
            copied.append({'project':project,'caseId':cid,'path':str(file.relative_to(root)),'sha256':digest,'bytes':len(data)})
        # Original worker statuses survive. CLI exit/qualification/timing rows do not;
        # preserve their output ink, but never invent those missing observations.
        status=raw['status'] if raw else 'blocked'
        invoked=isinstance(raw.get('firstMs'),(int,float)) if raw else bool(file)
        detail=raw.get('detail') if raw else 'Original CLI transport observation was lost before raw checkpoint; only retained output bytes are recovered where available.'
        outputs.append({'project':project,'caseId':cid,'witness':witness,'sha256':digest,'runtimeExecuted':invoked if invoked else None,'publicStatus':status,'detail':detail,'transportRecovered':raw is not None,'invocationEvidence':'worker firstMs' if raw and invoked else 'retained CLI output' if file else 'unavailable'})
        observations.append({'suite':'community','surface':raw.get('surface','node:public-api') if raw else 'cli:end-to-end','runtime':raw.get('runtime','Node') if raw else 'not retained','family':case['family'],'caseId':cid,'operation':'render','format':'terminal','mode':'feature-corpus-qualification','status':status,'detail':detail,'metrics':{'implementation':project,**({'firstMs':raw['firstMs']} if raw and 'firstMs' in raw else {}),**({'outputFile':str(file)} if file else {}),'recovered':True,'transportObservationRetained':raw is not None},**({'originalWorkerRow':raw} if raw else {})})
record={'profile':'terminal-project-corpus-v1','source':'d23d96a08a230ba60f29c3916adc7db3f82c3474','producers':[],'startedAt':None,'finishedAt':None,'inventory':reference['inventory'],'corpusFile':'corpus/terminal-project-examples.json','corpusSha256':reference['corpusSha256'],'reviewsSha256':reference['reviewsSha256'],'selectedCaseIds':[c['id'] for c in cases],'allInputs':True,'targetedExtension':True,'artifacts':[{'project':p['node']['id'],'version':p['artifact']['version'],'artifact':p['artifact']} for p in prepared],'sourceReference':reference['sourceReference'],'outputs':outputs,'transportObservations':observations,'recovery':{'kind':'offline-output-and-worker-recovery','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalCollectorExit':1,'originalCollectorReachedFinalAssessment':True,'cause':'A second legacy ASCII-required guard rejected a targeted cohort after public collection; raw.json was not checkpointed before observer execution.','originalCollectionClockRetained':False,'originalProducerReceiptRetained':False,'lostCliTransportObservations':240,'cliOutputWitnessesRetained':208,'workerObservationsRetained':120,'detailedInvocationEvidenceLowerBound':sum(x['runtimeExecuted'] is True for x in outputs),'perCoordinateInvocationStateWithoutEvidence':'unknown; not assumed uninvoked','sourceReferenceProvenance':{'path':str(reference_path),'sha256':sha(reference_path.read_bytes()),'reused':True,'reason':'Same120 source hashes, independent review hashes and Mermaid12.2.0 artifact. These are the previously retained checks; the repair source parses ran but their per-case records/clocks were lost.','newRepairSourceParseCalls':120},'evidence':[{'path':str(f.relative_to(root)),'sha256':sha(f.read_bytes())} for f in [original/'community-prepared.json',worker_path,job_path,root/'collection.log']],'recoveryScriptSha256':sha(Path(__file__).read_bytes()),'textWitnesses':copied}}
(recovered/'raw.json').write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'projects':len(prepared),'planned':len(outputs),'retainedWitnesses':len(copied),'detailedInvocationEvidenceLowerBound':record['recovery']['detailedInvocationEvidenceLowerBound'],'missingCliTransportRows':240,'sourceReference':'reused authenticated original120; repair parses were not retained','rawSha256':sha((recovered/'raw.json').read_bytes())},indent=2))
