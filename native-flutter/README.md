# Native Mermaid Flutter

Mermaid Flutter (`pub:mermaid_flutter`, `mermaid_flutter` 0.3.2) renders PNG through
its native `renderToPng` API, so Trident measures it with a native Linux release
application instead of a browser. The app in `app/` builds one release target,
`lib/davebench_worker.dart`, which `bun commands.ts davebench:native-png` runs for DaveBench
PNG completions and API time. PNG bytes are admitted mechanically and discarded.

`lib/main.dart` is the app's default entry point and is not used by the benchmarks.

## Build

Install Flutter 3.47.8 (Dart 3.13.7) with Linux desktop support, clang, cmake,
ninja-build, pkg-config and the GTK 3 development libraries. `env.sh` adds an
optional non-system SDK (`FLUTTER_ROOT`) or sysroot (`BENCH_SYSROOT`).

```sh
bash native-flutter/build.sh
```

The build checks the framework and engine revisions and Dart version in
`toolchain.json`, enforces the committed package lock, and builds the release
worker target. It then runs the production PNG admission controls and one fixed
Mermaid request under Xvfb with software rendering. These are deterministic
fixtures, with no performance thresholds or benchmark collection.

`trident-build.json` binds the source, lockfile, SDK and every bundle file.
`trident-smoke.json` binds the successful native checks to that bundle.
The Native Flutter verification workflow runs the same script on Ubuntu 24.04
and retains a tar archive preserving the complete bundle and executable modes.
A passing CI run verifies this build and smoke path; it supplies no benchmark
score. Fresh timings must still be collected separately outside CI.

Keep the complete release bundle (`build/linux/x64/release/bundle`), including its
data and shared libraries.

## Run

```sh
bun commands.ts davebench:native-png --host-display \
  --bundle native-flutter/app/build/linux/x64/release/bundle --out FRESH_DIRECTORY
```

`--host-display` runs under a private Xvfb display on this machine; `--image
sha256:IMAGE_ID` runs it in the managed Docker daemon instead. The counter checks
that the bundle was built from the current `davebench_worker.dart` and the locked
`mermaid_flutter` 0.3.2. Append its runs to the DaveBench image results before
`campaign:results` builds the report.

Mermaid Dart (`orestesgaolin/mermaid`) remains
the distinct SVG product; both use the Dart core for parsing and layout.
