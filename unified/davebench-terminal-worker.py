"""Persistent native Python call timing; no drawing output is retained."""
import json,sys,time
import termaid
print(json.dumps(dict(type='ready')),flush=True)
for line in sys.stdin:
 job=json.loads(line);start=time.perf_counter();outcome='completed'
 try:termaid.render(job['source'])
 except Exception:outcome='error'
 print(json.dumps(dict(type='result',id=job['id'],outcome=outcome,ms=(time.perf_counter()-start)*1000)),flush=True)
