# Terminal qualification: 31 October 2026

Corpus: [120 real source inputs](terminal-corpus.md) from capped research across
18 pinned repositories; 17 contribute selected inputs. Origins include docs,
regression fixtures, issue reproducers and PR additions. The [origin-role supplement](../corpus/terminal-origin-classification.json)
labels 67 terminal-specific inputs and 53 shared-renderer robustness inputs.
This is a development-exposed coverage sample, not usage-frequency evidence.

Independent inspection reviewed 22 source contracts. The campaign source-validated
all 120 inputs once with Mermaid 12.2.0, then invoked only the 16 observable drawing
contracts once each on two cached artifacts: **32 terminal calls**. Mermaid is an
unscored source reference. Nothing was acquired or built, and no warmup, repeated
performance or broad ecosystem campaign ran. Subsequent fixes rechecked saved text.

## Sixteen independently reviewed drawings

Ranks order **verified correct counts**. Unknowns remain unresolved; this is not a
rank of complete accuracy, all Mermaid support, aesthetics or speed.

| Verified-count rank | Project | Artifact | Correct | Incorrect | Unknown | Planned drawings |
|---:|---|---|---:|---:|---:|---:|
| 1 | Termaid | 0.10.0 | 12 | 1 | 3 | 16 |
| 2 | Mermaid ASCII | cached `git-5f00e3d9ac9f` | 11 | 3 | 2 | 16 |

The cached ASCII source build is identified by its actual binary hash. It is not
relabelled as the earlier 1.6.1 release executable. Termaid uses the frozen 0.10.0
wheel. Their cold CLI and warm Python API boundaries have no shared speed rank.

ASCII's three failures ignore the requested RL/BT node order. Termaid's RL source
with `Deploy`, `Test`, `Build` and `Code` draws the strings as `yolpeD`, `tseT`,
`dliuB` and `edoC`. These are bounded findings for the recorded artifacts and inputs.

Unknowns include ambiguous merges, a caption on a shared route and caption spaces
overpainted by route ink. The first observer also rejected legitimate vertical
captions and treated a caption's `v` as an arrowhead. Those were Trident errors;
positive and broken-output controls now verify their fixes against unchanged text.

## Full planned inventory

| Complete-accuracy rank | Project | Correct | Incorrect | Unknown | Planned inputs |
|---:|---|---:|---:|---:|---:|
| — | Termaid | 12 | 1 | 107 | 120 |
| — | Mermaid ASCII | 11 | 3 | 106 | 120 |

Each renderer has 104 unattempted inputs, deliberately retained as unknown: 98 lack
independent expectations, four reviewed drawings lack required observers, and two
actual invalid-source tests lack a qualified terminal rejection classifier. The
remaining unknowns came from observer gaps on the 16 attempted drawings. No source
is presumed unsupported because Trident cannot grade it. Full-corpus accuracy is
not established.

The original Python worker retained all 16 outputs but its controller omitted
their paths. A separate pointer-recovery receipt links the existing worker JSONL
records and text hashes; the original collection remains unchanged. This required
no renderer invocation. The forwarding path now has a fixture regression.

The [evidence receipt](evidence/terminal-corpus-2026-10-31/receipt.json) links the
original collections, frozen inputs, raw text, source/observer identities,
recovery and final reductions. Saved mode reproduces verdicts without either
renderer or Mermaid installation. Node terminal bindings also use the existing
sealed worker path; a synthetic fixture verifies one call and raw-text retention,
while browser-only capability rows make no invocation claim.
