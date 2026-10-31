import os,signal,subprocess,time,json,datetime
from pathlib import Path
root=Path('/workspace/trident-ecosystem-2026-10-31-campaign')
owner=87202
last_intervention=0
while Path('/proc/'+str(owner)).exists():
    files=[p for p in (root/'docs').rglob('*') if p.is_file()]
    latest=max((p.stat().st_mtime for p in files),default=time.time())
    now=time.time()
    if now-latest>180 and now-last_intervention>60:
        processes={}
        for line in subprocess.check_output(['ps','-eo','pid,ppid,args'],text=True).splitlines()[1:]:
            parts=line.split(None,2)
            if len(parts)==3:processes[int(parts[0])]=(int(parts[1]),parts[2])
        def owned(pid):
            seen=set()
            while pid in processes and pid not in seen:
                if pid==owner:return True
                seen.add(pid);pid=processes[pid][0]
            return False
        pids=[pid for pid,(_,command) in processes.items() if owned(pid) and '/usr/lib/chromium/chromium ' in command and '--utility-sub-type=network.mojom.NetworkService' in command]
        if pids:
            event={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'action':'Terminate stalled Chromium network utility; retain controller and owning observations','pids':pids,'idleSeconds':round(now-latest),'policy':'180 seconds with no changed collection evidence. This is a harness timeout/cleanup gap, never a diagram correctness failure.'}
            with (root/'supervisor-events.jsonl').open('a') as f:f.write(json.dumps(event)+'\n')
            for pid in pids:
                try:os.kill(pid,signal.SIGTERM)
                except ProcessLookupError:pass
            print(json.dumps(event),flush=True);last_intervention=now
    time.sleep(15)
print('Campaign controller exited; supervisor stopped',flush=True)
