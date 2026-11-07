"""Persistent native Python call timing; no drawing output is retained."""
import json,sys,time,platform,importlib.metadata
import termaid
print(json.dumps(dict(type='ready',package='termaid',version=importlib.metadata.version('termaid'),runtime=dict(engine='python',version=platform.python_version(),executable=sys.executable,platform=sys.platform,architecture=platform.machine(),isolated=bool(sys.flags.isolated),bytecodePrefix=sys.pycache_prefix))),flush=True)
for line in sys.stdin:
 job=json.loads(line);start=time.perf_counter();outcome='completed';value=None;error=None
 try:value=termaid.render(job['source'])
 except Exception as thrown:outcome='error';error=(str(thrown).split('\n')[0] or type(thrown).__name__)[:160]
 ms=(time.perf_counter()-start)*1000
 # Text goes to the host only for mechanical admission; it is not retained.
 print(json.dumps(dict(type='result',id=job['id'],outcome=outcome,ms=ms,output=value if isinstance(value,str) else None,**({'error':error} if error else {}))),flush=True)
