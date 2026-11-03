"""Persistent native Python call timing; no drawing output is retained."""
import json,sys,time
import termaid
print(json.dumps(dict(type='ready')),flush=True)
for line in sys.stdin:
 job=json.loads(line);start=time.perf_counter();outcome='completed';value=None
 try:value=termaid.render(job['source'])
 except Exception:outcome='error'
 ms=(time.perf_counter()-start)*1000
 # Text goes to the host only for mechanical admission; it is not retained.
 print(json.dumps(dict(type='result',id=job['id'],outcome=outcome,ms=ms,output=value if isinstance(value,str) else None)),flush=True)
