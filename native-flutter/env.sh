# Optional local SDK/sysroot selectors; normal system installs need neither.
if [[ -n "${FLUTTER_ROOT:-}" ]]; then
 export PATH="$FLUTTER_ROOT/bin:$PATH"
fi
if [[ -n "${BENCH_SYSROOT:-}" ]]; then
 export PATH="$BENCH_SYSROOT/usr/bin:$BENCH_SYSROOT/usr/lib/llvm-19/bin:$PATH"
 export LD_LIBRARY_PATH="$BENCH_SYSROOT/usr/lib/x86_64-linux-gnu:$BENCH_SYSROOT/usr/lib/llvm-19/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
 export PKG_CONFIG_PATH="$BENCH_SYSROOT/usr/lib/x86_64-linux-gnu/pkgconfig:$BENCH_SYSROOT/usr/share/pkgconfig${PKG_CONFIG_PATH:+:$PKG_CONFIG_PATH}"
 export CMAKE_PREFIX_PATH="$BENCH_SYSROOT/usr${CMAKE_PREFIX_PATH:+:$CMAKE_PREFIX_PATH}"
 export CPLUS_INCLUDE_PATH="$BENCH_SYSROOT/usr/include:$BENCH_SYSROOT/usr/include/x86_64-linux-gnu${CPLUS_INCLUDE_PATH:+:$CPLUS_INCLUDE_PATH}"
 export LIBRARY_PATH="$BENCH_SYSROOT/usr/lib/x86_64-linux-gnu${LIBRARY_PATH:+:$LIBRARY_PATH}"
fi
export FLUTTER_SUPPRESS_ANALYTICS=true
