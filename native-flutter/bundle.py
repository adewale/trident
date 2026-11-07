"""Bind the complete native release bundle to its SDK, source and locked packages."""
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
MANIFEST = "trident-build.json"
SMOKE = "trident-smoke.json"
ADMISSION_CHECKS = ["valid", "null", "empty", "non-png", "truncated-ihdr", "zero-size", "excessive-pixels", "overflow-dimensions", "excessive-encoded-bytes"]

def digest(path):
    value = hashlib.sha256()
    with open(path, "rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()

def read(path):
    return json.loads(Path(path).read_text())

def pin():
    return read(ROOT / "toolchain.json")

def check_sdk(sdk):
    expected = pin()
    for field, key in [("frameworkVersion", "flutter"), ("frameworkRevision", "frameworkRevision"), ("engineRevision", "engineRevision")]:
        if sdk.get(field) != expected[key]:
            raise ValueError("Pinned SDK mismatch: " + field)
    if str(sdk.get("dartSdkVersion", "")).split()[:1] != [expected["dart"]]:
        raise ValueError("Pinned Dart SDK mismatch")

def check_ready(ready):
    expected = pin()
    if ready.get("package") != expected["package"] or ready.get("version") != expected["packageVersion"] or ready.get("mode") != "release" or ready.get("runtime", {}).get("platform") != "linux" or str(ready.get("runtime", {}).get("dart", "")).split()[:1] != [expected["dart"]]:
        raise ValueError("Worker identity differs from the pinned release")

def sources():
    paths = [
        ROOT / name for name in ["toolchain.json", "env.sh", "build.sh", "bundle.py", "smoke.py", "app/pubspec.yaml", "app/pubspec.lock", "app/linux/CMakeLists.txt", "app/linux/flutter/CMakeLists.txt"]
    ]
    paths += list((ROOT / "app/lib").rglob("*.dart"))
    paths += [p for p in (ROOT / "app/linux/runner").iterdir() if p.is_file()]
    return {str(path.relative_to(ROOT)): digest(path) for path in sorted(paths)}

def files(bundle):
    entries = {}
    for path in sorted(bundle.rglob("*")):
        if path.is_symlink():
            raise ValueError("A portable release bundle cannot contain symlinks: " + str(path))
        if path.is_file() and path.relative_to(bundle).as_posix() not in [MANIFEST, SMOKE]:
            entries[path.relative_to(bundle).as_posix()] = digest(path)
    for required in ["native_bench", "lib/libapp.so", "lib/libflutter_linux_gtk.so", "data/icudtl.dat", "data/flutter_assets/AssetManifest.bin"]:
        if required not in entries:
            raise ValueError("Incomplete release bundle: " + required)
    return entries

def identity(entries):
    return hashlib.sha256(json.dumps(entries, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

def locked_version(package):
    text = (ROOT / "app/pubspec.lock").read_text()
    block = re.search(r"^  " + re.escape(package) + r":\n(.*?)(?=^  [A-Za-z_]\w*:|^sdks:|\Z)", text, re.M | re.S)
    version = re.search(r'^\s+version: "([^"]+)"', block[1], re.M) if block else None
    if not version:
        raise ValueError("Missing locked package: " + package)
    return version[1]

def write(path, value):
    temporary = path.with_suffix(path.suffix + ".pending")
    temporary.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")
    os.replace(temporary, path)

def verify(bundle, require_smoke=True):
    manifest = read(bundle / MANIFEST)
    if manifest.get("protocol") != "native-flutter-release-v1":
        raise ValueError("Missing native build receipt")
    check_sdk(manifest["sdk"])
    if manifest["sources"] != sources():
        raise ValueError("Native build sources or lockfile changed")
    entries = files(bundle)
    if manifest["files"] != entries or manifest["bundleSha256"] != identity(entries):
        raise ValueError("Native bundle changed after build")
    expected = pin()
    if manifest.get("target") != expected["target"] or manifest["packageVersion"] != expected["packageVersion"] or any(locked_version(name) != expected["packageVersion"] for name in ["mermaid_flutter", "mermaid_core"]):
        raise ValueError("Native package lock differs from the pinned operand")
    if require_smoke:
        smoke = read(bundle / SMOKE)
        if smoke.get("protocol") != "native-flutter-smoke-v1" or smoke.get("bundleSha256") != manifest["bundleSha256"] or smoke.get("result") != "completed" or smoke.get("admissionChecks") != ADMISSION_CHECKS:
            raise ValueError("Bundle has no matching successful native smoke receipt")
        check_ready(smoke.get("ready", {}))
    return manifest

def main():
    if sys.argv[1:] and sys.argv[1] == "check-sdk":
        sdk = read(sys.argv[2])
        check_sdk(sdk)
        print(json.dumps({"flutter": sdk["frameworkVersion"], "dart": sdk["dartSdkVersion"], "revision": sdk["frameworkRevision"]}))
        return
    if len(sys.argv) == 4 and sys.argv[1] == "seal":
        sdk, bundle = read(sys.argv[2]), Path(sys.argv[3]).resolve()
        check_sdk(sdk)
        expected = pin()
        if platform.system() != "Linux" or platform.machine() not in ["x86_64", "amd64"]:
            raise ValueError("The pinned bundle targets Linux x64")
        if any(locked_version(name) != expected["packageVersion"] for name in ["mermaid_flutter", "mermaid_core"]):
            raise ValueError("Package lock differs from mermaid_flutter/core 0.3.2")
        entries = files(bundle)
        record = {
            "protocol": "native-flutter-release-v1", "sdk": sdk,
            "target": expected["target"], "packageVersion": expected["packageVersion"],
            "sources": sources(), "files": entries, "bundleSha256": identity(entries),
            "host": {"platform": platform.platform(), "gtk": subprocess.check_output(["pkg-config", "--modversion", "gtk+-3.0"], text=True).strip()},
        }
        write(bundle / MANIFEST, record)
        print("Sealed native GTK release bundle " + record["bundleSha256"])
        return
    raise SystemExit("bundle.py check-sdk SDK.json | bundle.py seal SDK.json BUNDLE")

if __name__ == "__main__":
    main()
