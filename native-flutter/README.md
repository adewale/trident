# Native Mermaid Flutter

Mermaid Flutter (`pub:mermaid_flutter`, `mermaid_flutter` 0.3.2) renders PNG through
its native `renderToPng` API, so Trident measures it with a native Linux release
application instead of a browser. The app in `app/` has two release targets:

| Target | Used by |
|---|---|
| `lib/davebench_worker.dart` | `bun commands.ts davebench:native-png`: DaveBench PNG completions and API time. PNG bytes are admitted mechanically and discarded. |
| `lib/community_worker.dart` | The shared community protocol: `prepare-community.ts` seals the bundle as a prepared artifact for the other collectors. |

`lib/main.dart` is the app's default entry point and is not used by the benchmarks.

## Build

Install Flutter 3.47.8 (Dart 3.13.7) with Linux desktop support, clang, cmake,
ninja-build, pkg-config and the GTK 3 development libraries. `env.sh` adds an
optional non-system SDK (`FLUTTER_ROOT`) or sysroot (`BENCH_SYSROOT`).

```sh
cd native-flutter/app
flutter pub get --enforce-lockfile
flutter build linux --release --target lib/davebench_worker.dart   # or lib/community_worker.dart
```

Keep the complete release bundle (`build/linux/x64/release/bundle`), including its
data and shared libraries. Building the wrong target does not implement the
protocol the command expects.

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

To use the `community_worker.dart` bundle as a prepared artifact:

```sh
bun native-flutter/prepare-community.ts \
  --bundle native-flutter/app/build/linux/x64/release/bundle --out FRESH_DIRECTORY
```

Preparation hashes the wrapper, launch manifest and every bundle file. It builds
and renders nothing. Each launch checks the bundle inventory, hashes and runtime
API/version before accepting rows. Mermaid Dart (`orestesgaolin/mermaid`) remains
the distinct SVG product; both use the Dart core for parsing and layout.
