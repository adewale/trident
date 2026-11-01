# Ordinary terminal active profile

`bench --terminal` now selects `terminal-project-corpus-v3`, corpus version
`terminal-active-2026-10-31-v1`. Its [manifest](../../../corpus/terminal-active-profile.json)
explicitly lists 120 calls per selected renderer: 115 unchanged original drawing
sources, the independently reviewed authored alias adaptation, and all four
original invalid-source controls. Its 116 drawings and four rejection controls
have separate scored populations. The ambiguous original nested-state source
remains an unscored diagnostic with its exact bytes and provenance; the full
research inventory therefore retains 121 entries.

The original [120-source corpus](../../../corpus/terminal-project-examples.json)
is unchanged. `bench --terminal --plan --corpus original` exposes that historical
population. Saved v1/v2 runs select it automatically; rechecking them does not
substitute new source IDs. Fresh active records bind their corpus version,
manifest hash and full source membership. Old original-source outputs cannot
satisfy the new adaptation identity.

The separate source reader `/root/resolve_sources_and_tests` independently
recomputed all four input hashes, the active/diagnostic partition and the
adaptation identity, then ran the five active-profile controls successfully.
[The exact review receipt](source-review.json) binds manifest SHA-256
`e6caf38663a00ae44d4c883e4ba95c2ba5acff2be58aa8e572400d6406976224`.
This selection change modifies no source bytes, expected facts, source-review
registries, renderer outputs or timings.

The wiring validation covers public planning, original and active saved rechecks
without installed renderers, stale membership rejection, invalid-control
preservation, separate diagnostic metadata and ordinary campaign tables. The
full affected run passed 53 tests and 307 assertions; strict TypeScript checking
passed. It made no renderer or source-reference calls. The [separate adaptation
collection](../terminal-state-adaptation-2026-10-31/README.md) retains the three
previously authorized fresh calls and all 15 uncollected project coordinates.
