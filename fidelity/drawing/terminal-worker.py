import json,sys,importlib.metadata
import termaid
for line in sys.stdin:
    job=json.loads(line)
    try:
        if job.get('type')=='init' and importlib.metadata.version('termaid')!=job['peer']['artifact']['version']:raise RuntimeError('Installed termaid version differs from the prepared artifact')
        text=None if job.get('type')=='init' else termaid.render(job['source'])
        print(json.dumps(dict(id=job['id'],ok=True,text=text)),flush=True)
    except Exception as error:print(json.dumps(dict(id=job['id'],ok=False,error=str(error))),flush=True)
