"""Run fixed native-engine fixtures and one public API call; never collect scores."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
from bundle import ADMISSION_CHECKS, SMOKE, check_ready, verify, write

def main():
    if len(sys.argv) != 2:
        raise SystemExit("smoke.py RELEASE_BUNDLE")
    bundle = Path(sys.argv[1]).resolve()
    manifest = verify(bundle, require_smoke=False)
    source = "flowchart LR\n  A[Start] --> B[Finish]\n"
    request = json.dumps({"id": "native-ci-smoke", "source": source}) + "\n"
    environment = {**os.environ, "LIBGL_ALWAYS_SOFTWARE": "1", "GDK_BACKEND": "x11"}
    child = subprocess.Popen(["xvfb-run", "-a", "-s", "-screen 0 1280x720x24", str(bundle / "native_bench"), "--smoke"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True, env=environment)
    try:
        stdout, stderr = child.communicate(request, timeout=90)
        if child.returncode != 0:
            raise RuntimeError("Native worker failed: " + stderr[-4000:] + "\n" + stdout[-4000:])
        rows = []
        for line in stdout.splitlines():
            try:
                row = json.loads(line)
                if isinstance(row, dict):
                    rows.append(row)
            except ValueError:
                pass
        ready = [row for row in rows if row.get("type") == "ready"]
        controls = [row for row in rows if row.get("type") == "admission-smoke"]
        results = [row for row in rows if row.get("type") == "result"]
        if len(ready) != 1:
            raise RuntimeError("Worker did not emit exactly one ready message")
        check_ready(ready[0])
        required = ADMISSION_CHECKS
        if len(controls) != 1 or controls[0].get("checks") != required:
            raise RuntimeError("Production PNG admission controls did not all pass")
        if len(results) != 1 or results[0].get("id") != "native-ci-smoke" or results[0].get("outcome") != "completed":
            raise RuntimeError("Fixed public renderToPng call did not complete")
        record = {"protocol": "native-flutter-smoke-v1", "bundleSha256": manifest["bundleSha256"], "ready": ready[0], "admissionChecks": required, "result": "completed"}
        write(bundle / SMOKE, record)
        verify(bundle)
        print(json.dumps(record, sort_keys=True))
    finally:
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        child.wait()

if __name__ == "__main__":
    main()
