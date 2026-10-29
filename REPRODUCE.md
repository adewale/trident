# Reproduce the bounded native invocation check

Use Trident source `5867f424f5048e364be65b1ac1fdf6feb8a25301`, Node 24.19.0,
Bun 1.4.2 and Flutter 3.47.8 / Dart 3.13.7. The official Linux SDK archive is
`https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.47.8-stable.tar.xz`,
SHA-256 `baf7dcc5a3dbba60fe863bf493a6cf203195621f7786eaa5a1bba02cd0d87dd2`.
Install Flutter's Linux desktop prerequisites: clang, cmake, ninja, GTK3 development
libraries, Xvfb and fonts. The receipt records the actual dependency and font hashes;
different fonts or graphics libraries can change pixels.

From the clean checkout, install Trident's locked dependencies and pinned oracle:

```sh
bun install --frozen-lockfile
node commands.ts mermaid:install --dir /path/to/mermaid-reference
export MERMAID_REFERENCE_DIR=/path/to/mermaid-reference
(cd native-flutter/app && flutter pub get --enforce-lockfile && \
  flutter build linux --release --target lib/community_worker.dart)
```

Start Xvfb on a private local display (`Xvfb :97 -screen 0 1000x700x24 -nolisten tcp -ac`)
or use an existing desktop display. These reproduction commands run in a fresh
output root; set `VERIFY_ROOT` to its absolute path.

```sh
export DISPLAY=:97 LIBGL_ALWAYS_SOFTWARE=1
bun native-flutter/prepare-community.ts \
  --bundle "$PWD/native-flutter/app/build/linux/x64/release/bundle" \
  --out "$VERIFY_ROOT/prepared"
bun commands.ts support:verify \
  --catalog "$VERIFY_ROOT/prepared/catalog.json" \
  --prepared "$VERIFY_ROOT/prepared/prepared.json" \
  --projects orestesgaolin/mermaid --out "$VERIFY_ROOT/verification"
```

Replay from another directory using the absolute path to `commands.ts`, the same
saved preparation, a fresh output directory and no `FLUTTER_COMMUNITY_EXECUTABLE`.
Both reports should retain six positive inputs and two separate invalid controls.
A deliberately conflicting `FLUTTER_COMMUNITY_EXECUTABLE=/unsealed/not-native`
should produce a blocked project with no native output directory. Inspect the
report disposition; command completion alone does not imply successful admission.

Original manifests name the measured absolute paths. For a relocated or newly
built bundle, prepare a fresh manifest; retain the archived original unchanged.
Raw native rows preserve diagnostic first-call values, while the support reports
strip timing samples. They supply no performance comparison.

To check the published archive independently, install Python Pillow and run
`python3 verify-evidence.py` beside `archive.json` and the archive. It checks every
file digest, the actual bundle inventory, report denominators, qualified rows,
runtime/launch facts, PNG decoding and the blocked ambient-selector probe.
