# Pinned Mermaid original test runtime

`upstream:prepare` selects each required registry dependency from its actual
importer in the pinned source's `pnpm-lock.yaml`. It keeps the complete peer or
patch operand and the source manifest specifier in its receipt. This matters
when a range's minimum differs from its selected version: the reviewed source
selects uuid 14.0.0, KaTeX 0.18.11 and AJV 8.18.0.

The generated source `node_modules` symlink is excluded through local Git metadata,
without editing upstream source or its `.gitignore`. The selected runtime and
installed bytes are verified separately; other source changes remain visible.

The prepared runtime uses npm with those exact direct selections. Its npm lock,
direct tarball integrities, applied upstream patches and generated prerequisites
are recorded. npm still resolves the remaining transitive and peer graph;
this runtime is an explicit npm variant, not a reproduction of the complete
pnpm workspace closure. Published Mermaid/parser packages used by tooling are
identified as bridges; original source aliases remain unchanged.

The source's jsdom operand selects Canvas 3.2.3. Preparation installs that real
adapter, runs its explicit native installation step, then checks native pixel
readback and actual jsdom integration using the selected Node executable.
The receipt binds loaded native addon bytes, Node version and platform.
The npm SRI authenticates the published Canvas wrapper tarball; its install
step separately downloads or builds the native addon. A retained provisioning
log and observed native SHA identify that platform artifact without claiming
the pnpm lock authenticated its binary. External system libraries and fonts
remain platform inputs. The qualified installed-closure digest also detects
later package-byte changes that a package-lock/version check alone cannot.

Use fresh source and runtime directories so an existing measured environment
remains immutable:

```sh
bun commands.ts upstream:prepare --source /checkouts/pinned-mermaid-clean \
  --runtime /runtimes/mermaid-original-locked-direct \
  --reference /runtimes/pinned-mermaid-public \
  --node-executable /runtimes/node/bin/node
```

A preparation lock prevents concurrent writers. Repeating preparation of an
unchanged qualified runtime verifies it read-only; it never runs npm-ci or
rebuilds that measured environment. Changed or older receipts require fresh
directories. Canvas provisioning may download a platform prebuild or require
the native compiler/Cairo prerequisites; failure blocks qualification rather
than substituting another implementation.

The original suite checks this environment before collecting callbacks. An
unqualified kit or unavailable Canvas blocks collection; missing infrastructure
does not become a Mermaid fidelity failure. Old raw attempts stay unchanged.
Every qualified original baseline requires the sealed preparation, irrespective
of its package name. A caller-supplied or renamed runtime cannot select a weaker
admission policy. The installed Vitest version is observed and must match the
source lock; it is never inferred from the intended dependency plan.
After repairing this prerequisite, rerun only `upstream-original`; unrelated
public Mermaid API records do not need new clocks.
