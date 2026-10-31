"""A Python public-API worker. This is not a CLI startup measurement."""
import json,sys,time,statistics,re,resource,pathlib,hashlib,zipfile,importlib.metadata,os,uuid,datetime
job=json.load(open(sys.argv[1]));out=open(sys.argv[2],'x');started=time.perf_counter()
raw=open(sys.argv[2]+'.invocations.jsonl','x')
outputs=pathlib.Path(sys.argv[2]+'.outputs');outputs.mkdir()
def utc():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def emit(stream,value):
 stream.write(json.dumps(value,allow_nan=False)+'\n');stream.flush();os.fsync(stream.fileno())
def retain(data):
 sha=hashlib.sha256(data).hexdigest();target=outputs/sha
 if not target.exists():
  pending=outputs/(sha+'.'+str(uuid.uuid4())+'.pending')
  with open(pending,'xb') as file:file.write(data);file.flush();os.fsync(file.fileno())
  try:os.link(pending,target)
  finally:pending.unlink()
  directory=os.open(outputs,os.O_RDONLY)
  try:os.fsync(directory)
  finally:os.close(directory)
 elif target.read_bytes()!=data:raise ValueError('Immutable raw output changed')
 return dict(path=str(target),sha256=sha,bytes=len(data))
def call(w):
 frame=dict(schema='trident-invocation-evidence-v1',attemptId=str(uuid.uuid4()),identity=w['invocationIdentity'],state='started',startedAt=utc(),finishedAt=None,recordedAt=utc(),durationMs=None,output=None,detail='Scheduled public call; no return inferred')
 emit(raw,frame)
 clock=time.perf_counter()
 try:sink=render(w['source'])
 except Exception as error:
  duration=(time.perf_counter()-clock)*1000
  emit(raw,dict(frame,state='public-error',finishedAt=utc(),recordedAt=utc(),durationMs=duration,detail=str(error)))
  raise
 duration=(time.perf_counter()-clock)*1000;finished=utc()
 data=sink.encode('utf-8') if isinstance(sink,str) else json.dumps(dict(returnType=type(sink).__name__,value=repr(sink)),allow_nan=False).encode('utf-8')
 returned=dict(frame,state='returned',finishedAt=finished,recordedAt=utc(),durationMs=duration,output=retain(data),detail='Actual public return retained before qualification; duration excludes retention')
 emit(raw,returned)
 return sink,duration,returned

import termaid
if job.get('retainOutputWitness'):
 frozen=job['frozenPython']
 if importlib.metadata.version('termaid')!=frozen['version']:raise ValueError('Installed version differs from freeze')
 root=pathlib.Path(termaid.__file__).parent.parent
 for wheel in frozen['files']:
  with zipfile.ZipFile(wheel['path']) as archive:
   for name in archive.namelist():
    if name.endswith('.py') and hashlib.sha256((root/name).read_bytes()).digest()!=hashlib.sha256(archive.read(name)).digest():raise ValueError('Installed source differs from frozen wheel: '+name)
render=termaid.render
if not callable(render):raise TypeError('Public termaid.render is unavailable')
emit(out,dict(type='import',ms=(time.perf_counter()-started)*1000))
class ObserverUnavailable(Exception):pass
def source_outcome(w,kind,detail):return dict(project=w['invocationIdentity']['project'],caseId=w['id'],sourceSha256=w['invocationIdentity']['sourceSha256'],kind=kind,publicBoundary='termaid.render(source)',detail=detail,observerSha256=job['observerSha256'])
def qualify(sink,w):
 if 'expected-empty-drawing' in w.get('features',[]):
  if not isinstance(sink,str):raise ValueError('Empty drawing must return terminal text')
  plain=re.sub(r'\x1b\[[0-9;]*m','',sink)
  if '\x1b' in plain:raise ObserverUnavailable('Empty-drawing observer cannot interpret terminal escape state')
  if plain.strip():raise ValueError('Expected empty drawing returned visible terminal ink')
  return
 if not isinstance(sink,str)or not sink.strip():raise ValueError('Empty terminal artifact')
 try:
  value=json.loads(sink)
  if isinstance(value,(dict,list)):raise ValueError('JSON sidecars are not terminal ink')
 except json.JSONDecodeError:pass
 plain_lines=[re.sub(r'\s*[│┃|]\s*$','',re.sub(r'^\s*[│┃|]\s?','',line))for line in re.sub(r'\x1b\[[0-9;]*m','',sink).splitlines()]
 plain=' '.join(line for line in plain_lines if not re.fullmatch(r'[\s┌┐└┘├┤┬┴┼─━┏┓┗┛╭╮╰╯+|=-]*',line))
 compact=lambda value:re.sub(r'\s+','',value).lower()
 bare='\n'not in w['source'].strip()and len(w['source'].strip().split())<=2 and not re.search(r'[;:\[\]{}<>|]',w['source'])
 if not bare and compact(w['source']) and compact(w['source']) in compact(plain):raise ValueError('Visible terminal output echoes source instead of diagram ink')
 missing=[label for label in w['expected']if not re.search(r'(?<!\w)'+re.escape(re.sub(r'\s+',' ',label).strip())+r'(?!\w)',re.sub(r'\s+',' ',sink))]
 if missing:raise ValueError('Missing declared labels: '+', '.join(missing[:8]))
for w in job['workloads']:
 r=dict(type='result',workload=w['id']);stage='public-api'
 try:
  sink,first,returned=call(w);r.update(typedSourceOutcome=source_outcome(w,'accepted','Actual public function returned'),firstMs=first,invocationId=returned['attemptId'],outputFile=returned['output']['path'],measuredAt=returned['finishedAt'])
  stage='qualification'
  if w.get('intent')=='negative-admission':
   r.update(status='error',rejected=False,detail='Public API accepted independently invalid source')
   emit(out,r);continue
  qualify(sink,w)
  if job.get('coverageOnly'):
   r.update(status='ok',firstMs=first,outputBytes=len(sink.encode()),coverageOnly=True)
   emit(out,r);continue
  stage='public-api'
  t=time.perf_counter();n=0
  while n<job['timing']['warmCalls']or(time.perf_counter()-t)*1000<job['timing']['warmupMs']:sink,_,_=call(w);n+=1
  per=(time.perf_counter()-t)*1000/n;iterations=max(1,min(1024,__import__('math').ceil(job['timing']['minSampleMs']/max(.001,per))));samples=[]
  for _ in range(job['timing']['samples']):
   duration=0
   for i in range(iterations):
    sink,elapsed,_=call(w);duration+=elapsed
   samples.append(duration/iterations)
  stage='qualification'
  qualify(sink,w)
  r.update(status='ok',firstMs=first,samplesMs=samples,medianMs=statistics.median(samples),outputBytes=len(sink.encode()),timingQualified=False,timingProtocol='legacy-adaptive-individually-retained-unqualified-v1')
 except Exception as e:
  typed_rejection=stage=='public-api' and isinstance(e,SyntaxError)
  unavailable=stage=='public-api' and not typed_rejection
  r.update(status='blocked' if isinstance(e,ObserverUnavailable) or unavailable and w.get('intent')=='negative-admission' else 'error',rejected=True if typed_rejection else None if unavailable else False,typedSourceOutcome=r.get('typedSourceOutcome') if stage!='public-api' else source_outcome(w,'syntax-rejection' if typed_rejection else 'unavailable',str(e)),failureStage=stage,detail=str(e))
 emit(out,r)
emit(out,dict(type='end',maxRssKiB=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss));raw.close();out.close()
