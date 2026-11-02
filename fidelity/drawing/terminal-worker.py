import json,sys
import termaid
for line in sys.stdin:
    job=json.loads(line)
    try:
        text=None if job.get('type')=='init' else termaid.render(job['source'])
        print(json.dumps(dict(id=job['id'],ok=True,text=text)),flush=True)
    except Exception as error:print(json.dumps(dict(id=job['id'],ok=False,error=str(error))),flush=True)
