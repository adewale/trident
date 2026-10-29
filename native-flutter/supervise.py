#!/usr/bin/env python3
"""Reserve and supervise one entrypoint process; never overwrite an earlier run."""
import argparse
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import platform
import signal
import socket
import subprocess
import sys
import time

PROTOCOL = "native-entrypoints-v2"


def utc():
    return datetime.now(timezone.utc).isoformat()


def write_json(path, value):
    # The reservation owns this directory; replacement makes receipts crash-safe.
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w") as stream:
        json.dump(value, stream, indent=2)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)


def event(out, value):
    with (out / "process-events.jsonl").open("a") as stream:
        stream.write(json.dumps({"protocol": PROTOCOL, "time": utc(), **value}) + "\n")
        stream.flush()
        os.fsync(stream.fileno())


def process_groups(root_pid):
    """Include detached Chromium descendants, not just the launcher's group."""
    groups = {root_pid}
    processes = {}
    for entry in Path("/proc").glob("[0-9]*/stat"):
        try:
            fields = entry.read_text().rsplit(")", 1)[1].split()
            processes[int(entry.parent.name)] = (int(fields[1]), int(fields[2]))
        except (OSError, ValueError, IndexError):
            continue
    descendants = {root_pid}
    while True:
        found = {pid for pid, (parent, _) in processes.items() if parent in descendants}
        if found <= descendants:
            break
        descendants |= found
    groups |= {processes[pid][1] for pid in descendants if pid in processes}
    return groups - {os.getpgrp()}


def stop_groups(groups, sig):
    for group in groups:
        try:
            os.killpg(group, sig)
        except ProcessLookupError:
            pass


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--timeout", type=float, default=1800)
    parser.add_argument("--grace", type=float, default=1)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args(argv)
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if (
        not command
        or not math.isfinite(args.timeout)
        or args.timeout <= 0
        or not math.isfinite(args.grace)
        or args.grace < 0
    ):
        parser.error(
            "a command, positive finite timeout, and nonnegative finite grace are required"
        )
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    # Retained forever, including after failure. This is a reservation, not a stale lock.
    try:
        with (out / ".supervisor-reservation.json").open("x") as stream:
            json.dump({"protocol": PROTOCOL, "pid": os.getpid(), "time": utc()}, stream)
    except FileExistsError:
        print(f"Run already reserved: {out}", file=sys.stderr)
        return 2
    existing = set(p.name for p in out.iterdir()) - {".supervisor-reservation.json"}
    if existing:
        print(f"Output contains earlier evidence: {out}", file=sys.stderr)
        return 2
    receipt = {
        "protocol": PROTOCOL,
        "status": "starting",
        "started_at": utc(),
        "command": command,
        "cwd": str(Path.cwd()),
        "out": str(out),
        "timeout_seconds": args.timeout,
        "termination_grace_seconds": args.grace,
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "architecture": platform.machine(),
        "python": sys.version,
    }
    write_json(out / "supervisor.json", receipt)
    started = time.monotonic()
    proc = None
    groups = set()
    status = "crash"
    code = 1
    try:
        with (out / "stdout.log").open("x") as stdout, (out / "stderr.log").open(
            "x"
        ) as stderr:
            proc = subprocess.Popen(
                command,
                stdout=stdout,
                stderr=stderr,
                env={**os.environ, "OUT": str(out), "BENCH_PROTOCOL": PROTOCOL},
                start_new_session=True,
            )
            receipt["pid"] = proc.pid
            write_json(out / "supervisor.json", receipt)
            event(out, {"status": "started", "pid": proc.pid})
            try:
                deadline = started + args.timeout
                while True:
                    groups |= process_groups(proc.pid)
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise subprocess.TimeoutExpired(command, args.timeout)
                    try:
                        returncode = proc.wait(timeout=min(remaining, 0.05))
                        break
                    except subprocess.TimeoutExpired:
                        continue
                status = "completed" if returncode == 0 else "crash"
                code = returncode if returncode >= 0 else 128 - returncode
                if returncode != 0:
                    stop_groups(groups, signal.SIGKILL)
            except subprocess.TimeoutExpired:
                status, code = "timeout", 124
                groups |= process_groups(proc.pid)
                stop_groups(groups, signal.SIGTERM)
                try:
                    proc.wait(timeout=args.grace)
                except subprocess.TimeoutExpired:
                    pass
                # Also kill detached children even if the launcher exited on TERM.
                groups |= process_groups(proc.pid)
                stop_groups(groups, signal.SIGKILL)
                proc.wait()
            receipt["returncode"] = proc.returncode
    except Exception as error:
        receipt["error"] = repr(error)
    finally:
        if proc is not None and proc.poll() is None:
            stop_groups(groups | process_groups(proc.pid), signal.SIGKILL)
            proc.wait()
        receipt.update(
            status=status, finished_at=utc(), elapsed_seconds=time.monotonic() - started
        )
        active = out / "active-call.json"
        if active.exists():
            try:
                receipt["active_call"] = json.loads(active.read_text())
            except (OSError, ValueError):
                pass
        write_json(out / "supervisor.json", receipt)
        event(out, receipt)
    return code


if __name__ == "__main__":
    sys.exit(main())
