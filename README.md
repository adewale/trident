# Final-head ZenUML verification

[Qualification receipt](qualification.json) binds the raw archive and source head. The archive contains the original owning results, requested-file inventories and immutable subset record. No full-portfolio measurement or speed comparison is claimed.

The final head passes 20 public SVG observations and 10 requested-module-closure observations. The closure is stage-wide and names the selected ZenUML case IDs. All closures include the pinned first-party addon. The record remains in `pinned-browser-baseline-subset`; complete paint and native semantic qualification remain unmeasured.

The archive SHA-256 is in the receipt. Absolute paths inside the raw records are provenance from the original workspace, not public download links. The actual GitHub check covers static checks and fixtures; the full 431-test suite and browser verification ran locally.

Reproduce from the source head with the pinned Mermaid source, independent oracle and addon installed:

```sh
bun unified/baseline-browser.ts --mode full --projects mermaid-js/mermaid \
  --reference-root /reference/node_modules/mermaid --upstream-root /pinned-source \
  --cases family:zenuml,required:zenuml --stages renderer \
  --browser /path/to/chromium --out /fresh/zenuml --records /external/records
```
