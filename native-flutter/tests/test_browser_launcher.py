"""Targeted native-entrypoints-v2 browser/launcher checks; no build or campaign."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest

BASE = Path(__file__).resolve().parents[1]
SUPERVISOR = BASE / "supervise.py"


class BrowserLauncherV2Tests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="trident-browser-v2-")
        self.root = Path(self.temporary.name)

    def tearDown(self):
        self.temporary.cleanup()

    def node(self, code, **environment):
        return subprocess.run(
            ["node", "--input-type=module", "-e", code],
            cwd=BASE,
            env={**os.environ, **environment},
            capture_output=True,
            text=True,
            timeout=30,
        )

    def supervise(self, out, code, timeout=2):
        return subprocess.run(
            [
                sys.executable,
                str(SUPERVISOR),
                "--out",
                str(out),
                "--timeout",
                str(timeout),
                "--grace",
                "0.1",
                "--",
                sys.executable,
                "-c",
                code,
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

    def test_wrong_module_rejected_before_output_reservation(self):
        override = self.root / "different.js"
        override.write_text("export function render() {}")
        out = self.root / "wrong-module"
        result = subprocess.run(
            ["node", "pele.mjs"],
            cwd=BASE,
            env={**os.environ, "PELE_MODULE": str(override), "OUT": str(out)},
            capture_output=True,
            text=True,
            timeout=10,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("differs from the installed pinned Pele 1.9.0", result.stderr)
        self.assertFalse(out.exists(), result.stderr)

    def test_identical_override_allowed_but_wrong_package_version_rejected(self):
        result = self.node(
            """
            import assert from 'node:assert/strict';
            import fs from 'node:fs';
            import { verifyPeleModule } from './pele.mjs';
            const original = verifyPeleModule();
            const copy = process.env.COPY;
            fs.writeFileSync(copy, original.bytes);
            assert.equal(verifyPeleModule(copy).identity.sha256, original.identity.sha256);
            fs.writeFileSync(process.env.PACKAGE, JSON.stringify({name:'pele',version:'2.0.0'}));
            assert.throws(() => verifyPeleModule(copy), /exactly Pele 1.9.0/);
        """,
            COPY=str(self.root / "pele.js"),
            PACKAGE=str(self.root / "package.json"),
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_tampered_installed_entry_cannot_be_its_own_pin(self):
        result = self.node(
            """
            import assert from 'node:assert/strict';
            import fs from 'node:fs';
            import {fileURLToPath} from 'node:url';
            import {verifyPeleModule} from './pele.mjs';
            const originalRead=fs.readFileSync;
            const entry=fileURLToPath(import.meta.resolve('pele'));
            fs.readFileSync=function(p,...args){return p===entry ? Buffer.from('tampered') : originalRead.call(this,p,...args)};
            try { assert.throws(()=>verifyPeleModule(), /entry digest differs/); }
            finally { fs.readFileSync=originalRead; }
            """
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_preparation_once_and_failed_baseline_does_not_hide_measured_calls(self):
        result = self.node(
            """
            import assert from 'node:assert/strict';
            import { preparePhase, measureSample } from './pele.mjs';
            const calls=[];
            globalThis.window={pele:{render(source){calls.push(source); throw Error(source);}},handle:null};
            globalThis.document={querySelector(){return {replaceChildren(){}};}};
            const c={id:'probe',source:'invalid-original',updatedSource:'valid-update'};
            const prep=await preparePhase({c,api:'render',phase:'update'});
            assert.equal(prep.failure_stage,'preparation');
            assert.equal(prep.measured_call_started,false);
            const a=await measureSample({c,api:'render',phase:'update',i:0});
            const b=await measureSample({c,api:'render',phase:'update',i:1});
            assert.deepEqual(calls,['invalid-original','valid-update','invalid-original']);
            assert.equal(a.source_before,'invalid-original');
            assert.equal(a.source_after,'valid-update');
            assert.equal(b.source_before,'valid-update');
            assert.equal(b.source_after,'invalid-original');
            assert.equal(a.measured_call_started,true);
            assert.equal(a.failure_stage,'operation');
            assert.equal(b.measured_call_started,true);
            window.pele.mount=()=>{throw Error('no handle')};
            await preparePhase({c,api:'mount',phase:'update'});
            const missing=await measureSample({c,api:'mount',phase:'update',i:0});
            assert.equal(missing.measured_call_started,false);
            assert.equal(missing.failure_stage,'preparation');
        """
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_browser_duplicate_reservation_rejected_without_overwrite(self):
        out = self.root / "reserved-browser"
        out.mkdir()
        marker = out / ".browser-reservation.json"
        marker.write_text("original reservation")
        result = subprocess.run(
            ["node", "pele.mjs"],
            cwd=BASE,
            env={
                **os.environ,
                "OUT": str(out),
                "PELE_MODULE": str(BASE / "node_modules/pele/dist/pele.js"),
            },
            capture_output=True,
            text=True,
            timeout=10,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("EEXIST", result.stderr)
        self.assertEqual(marker.read_text(), "original reservation")
        self.assertFalse((out / "samples.jsonl").exists())

    def test_supervisor_timeout_retains_output_and_active_call(self):
        out = self.root / "stall"
        result = self.supervise(
            out,
            """
import json,os,time
from pathlib import Path
out=Path(os.environ['OUT'])
(out/'samples.jsonl').write_text('retained sample\\n')
(out/'active-call.json').write_text(json.dumps({'id':'stalled','measured_call_started':True}))
print('retained stdout',flush=True)
time.sleep(100)
""",
            timeout=0.3,
        )
        self.assertEqual(result.returncode, 124, result.stderr)
        receipt = json.loads((out / "supervisor.json").read_text())
        self.assertEqual(receipt["protocol"], "native-entrypoints-v2")
        self.assertEqual(receipt["status"], "timeout")
        self.assertEqual(receipt["active_call"]["id"], "stalled")
        self.assertEqual((out / "samples.jsonl").read_text(), "retained sample\n")
        self.assertIn("retained stdout", (out / "stdout.log").read_text())
        self.assertEqual(
            json.loads((out / "process-events.jsonl").read_text().splitlines()[-1])[
                "status"
            ],
            "timeout",
        )

    def test_supervisor_crash_and_spawn_failure_are_retained(self):
        out = self.root / "crash"
        result = self.supervise(
            out, "import sys; print('failure',file=sys.stderr); sys.exit(7)"
        )
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertEqual(
            json.loads((out / "supervisor.json").read_text())["status"], "crash"
        )
        self.assertIn("failure", (out / "stderr.log").read_text())
        missing = self.root / "spawn-failure"
        result = subprocess.run(
            [
                sys.executable,
                str(SUPERVISOR),
                "--out",
                str(missing),
                "--",
                str(self.root / "missing-executable"),
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        self.assertNotEqual(result.returncode, 0)
        receipt = json.loads((missing / "supervisor.json").read_text())
        self.assertEqual(receipt["status"], "crash")
        self.assertIn("FileNotFoundError", receipt["error"])

    def test_concurrent_supervisor_writer_rejected(self):
        out = self.root / "concurrent"
        command = [
            sys.executable,
            str(SUPERVISOR),
            "--out",
            str(out),
            "--timeout",
            "0.6",
            "--grace",
            "0.1",
            "--",
            sys.executable,
            "-c",
            "import time; time.sleep(100)",
        ]
        first = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        try:
            deadline = time.monotonic() + 3
            while (
                not (out / "supervisor.json").exists() and time.monotonic() < deadline
            ):
                time.sleep(0.01)
            self.assertTrue((out / "supervisor.json").exists())
            second = self.supervise(out, "raise RuntimeError('must not run')")
            self.assertEqual(second.returncode, 2, second.stderr)
            self.assertIn("already reserved", second.stderr)
            first.communicate(timeout=5)
            self.assertEqual(first.returncode, 124)
            self.assertEqual(
                json.loads((out / "supervisor.json").read_text())["status"], "timeout"
            )
        finally:
            if first.poll() is None:
                first.kill()
                first.communicate()

    def test_non_x86_host_rejected_before_build_or_reservation(self):
        fake_bin = self.root / "bin"
        fake_bin.mkdir()
        uname = fake_bin / "uname"
        uname.write_text("#!/bin/sh\necho aarch64\n")
        uname.chmod(0o755)
        environment = {**os.environ, "PATH": str(fake_bin) + ":" + os.environ["PATH"]}
        environment.pop("FLUTTER_ROOT", None)
        environment.pop("BENCH_SYSROOT", None)
        for launcher in ["reproduce.sh", "first-use.sh"]:
            result = subprocess.run(
                ["bash", str(BASE / launcher)],
                env=environment,
                capture_output=True,
                text=True,
                timeout=5,
            )
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertIn("requires an x86_64", result.stderr)

    def test_supervisor_kills_detached_descendant_on_deadline(self):
        out = self.root / "detached"
        result = self.supervise(
            out,
            """
import os,subprocess,sys,time
from pathlib import Path
child=subprocess.Popen([sys.executable,'-c','import time; time.sleep(100)'],start_new_session=True)
Path(os.environ['OUT'],'child.pid').write_text(str(child.pid))
time.sleep(100)
""",
            timeout=0.4,
        )
        self.assertEqual(result.returncode, 124, result.stderr)
        pid = int((out / "child.pid").read_text())
        stat = Path(f"/proc/{pid}/stat")
        deadline = time.monotonic() + 2
        while stat.exists() and time.monotonic() < deadline:
            try:
                if stat.read_text().rsplit(")", 1)[1].split()[0] == "Z":
                    break
            except FileNotFoundError:
                break
            time.sleep(0.01)
        if stat.exists():
            self.assertEqual(stat.read_text().rsplit(")", 1)[1].split()[0], "Z")

    @unittest.skipUnless(
        Path("/usr/bin/chromium").exists(), "system Chromium unavailable"
    )
    def test_real_chromium_invalid_original_valid_update(self):
        cases = self.root / "cases.json"
        cases.write_text(
            json.dumps(
                [
                    {
                        "id": "probe",
                        "source": "flowchart TD\nA[broken -->",
                        "updatedSource": "flowchart TD\nA[Valid] --> B[Updated]",
                    }
                ]
            )
        )
        out = self.root / "browser"
        environment = {
            **os.environ,
            "OUT": str(out),
            "CASES_FILE": str(cases),
            "ROUNDS": "1",
            "SAMPLES": "2",
            "WARMUPS": "0",
            "ONLY_PHASE": "update",
            "HEADED": "0",
            "BROWSER_CALL_TIMEOUT_MS": "10000",
        }
        for key in ["ONLY_CASE", "ONLY_API", "PELE_MODULE"]:
            environment.pop(key, None)
        result = subprocess.run(
            ["node", "pele.mjs"],
            cwd=BASE,
            env=environment,
            capture_output=True,
            text=True,
            timeout=40,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = [
            json.loads(line)
            for line in (out / "samples.jsonl").read_text().splitlines()
        ]
        self.assertEqual(len(rows), 4)
        for api in ["render", "mount"]:
            rs = [r for r in rows if r["api"] == api]
            self.assertEqual([r["status"] for r in rs], ["painted", "error"])
            self.assertTrue(all(r["measured_call_started"] for r in rs))
            self.assertEqual(
                rs[0]["source_before"], json.loads(cases.read_text())[0]["source"]
            )
            self.assertEqual(rs[1]["source_before"], rs[0]["source_after"])
            self.assertEqual(rs[1]["failure_stage"], "operation")
        preparation = [
            json.loads(line)
            for line in (out / "preparation.jsonl").read_text().splitlines()
        ]
        self.assertEqual(len(preparation), 2)
        self.assertTrue(all(p["failure_stage"] == "preparation" for p in preparation))
        receipt = json.loads((out / "browser-receipt.json").read_text())
        self.assertEqual(receipt["status"], "completed")
        self.assertEqual(receipt["pele"]["version"], "1.9.0")
        self.assertEqual(len(receipt["pele"]["sha256"]), 64)
        self.assertTrue((out / "probe_render_update.png").exists())

    @unittest.skipUnless(
        Path("/usr/bin/chromium").exists(), "system Chromium unavailable"
    )
    def test_browser_call_deadline_interrupts_sync_renderer_stall(self):
        result = self.node(
            """
            import assert from 'node:assert/strict';
            import { chromium } from 'playwright';
            import { withDeadline } from './pele.mjs';
            const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
            try {
                const page=await browser.newPage();
                await assert.rejects(withDeadline(page.evaluate(()=>{while(true){}}),100,'deliberate stall'),{name:'DeadlineError'});
            } finally { await withDeadline(browser.close(),5000,'cleanup'); }
        """
        )
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
