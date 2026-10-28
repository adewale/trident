# Attempt disposition

Only `community-run/` supplies compatibility scorecards and cost tables (producer
2a3d439ecafdaab20bd7fd1d71abe35e4a7bb6ce). `measured-run/` supplies only the
unaffected docs and Meaning suites (producer7efe6f816c6a8f115e5208f2eb6185b72abf7826).

- `preflight-run/`: setup failure for compatibility (native DISPLAY absent,
  browser qualification helper absent). Retained as setup evidence, not renderer
  failures. Its docs/meaning outputs were superseded by complete reruns.
- `run/`: completed exploratory collection on base 26ad0f9 plus the exact saved
  `measured-source/` working files. Native result consumption and PNG output
  were real; the executable/bundle selector was not enforced. Its metrics and
  first-only timing qualification had the limitations described in AUDIT.md.
  Not used as final timing evidence.
- `final-run/`: interrupted after overlapping the start of the full repository
  tests. Its timings are invalid for an uncontended run and supply no scorecard.
- `measured-run/`: full replacement run, after tests/build/static analysis ended.
  Its community timing is superseded because parent qualification could overlap
  the next native case. Its unaffected docs and Meaning records remain selected.
  Native launch receipts bind the actual executable and libapp.so to the sealed
  bundle. It qualifies retained first and final PNGs outside API clocks and
  records actual sample iterations.

The full test dispatcher initially reported 391 passes, 2 skips and 1 failure
because shared producer changes were uncommitted. After committing, the full
run reported 388 passes without a failure but stalled without a final summary;
it was terminated. No full-suite pass is claimed. The targeted final six-file
suite completed with 23 passes after the final failure-path regression, and the observer-disposition regression failed
when the two production changes were reverted. TypeScript checking, native
release compilation and Dart analysis completed successfully.

- `community-run/`: corrected compatibility-only run with per-case acknowledgement
  barriers, first/final PNG qualification, correct coverage metadata and an
  enforced executable/bundle relationship. This is the compatibility timing owner.
