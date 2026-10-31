# Terminal Rendering

Terminal Rendering uses [120 real project inputs](terminal-corpus.md), selected
from documentation, regression fixtures, issues and PRs. Research covers 18 pinned
repositories; 17 contribute selected inputs. The corpus covers 20 diagram families
plus invalid sources. It is a coverage sample, not production-frequency evidence.
[Origin roles](../corpus/terminal-origin-classification.json) distinguish 67 inputs
with terminal-specific evidence from 53 shared-renderer robustness inputs. Those
shared cases do not establish terminal user demand for their diagram families.

[Independent source review](../corpus/terminal-project-reviews.json) currently binds
22 contracts to exact source bytes: 20 drawing contracts and two real invalid-input
tests. Sixteen drawings have enough independently declared facts for the current
observer. The other 98 inputs have no independent drawing contract; four reviewed
drawings retain observer gaps. Typed negative-input rejection is also unmeasured.

## Run a small qualification

Mermaid ASCII is mandatory; the default second implementation is Termaid. Mermaid
validates source grammar and checks agreement with the independent graph contracts.
It is an unscored source reference, never a fictional terminal renderer.

```sh
bun commands.ts bench --terminal --plan
bun commands.ts bench --terminal --community-prepared FROZEN.json --out FRESH_DIR
```

The default collects the 16 reviewed drawings once per terminal renderer and
retains every other planned cell as unknown. `--all-inputs` explicitly attempts the
whole source inventory. Preparation must already contain the selected artifacts:
this profile performs no acquisition, build, warmup or repeated timing campaign.
Source-reference refusal does not automatically turn a dialect input into an
independently established invalid-source test.

After fixing an observer, reuse the retained text:

```sh
bun commands.ts bench --terminal --saved-terminal SAVED_DIR --out NEW_DIR
```

Saved mode authenticates source identities, research origins, witnesses and the
recorded reference role. It requires neither Mermaid nor a terminal renderer and
can run in CI. Original collection clocks and producers stay separate from the
current observer. Results use the existing campaign publication and snapshot path.

## What correctness establishes

The observer finds actual boxes and labels, traces continuous routes backward
from arrowheads and checks the exact directed-edge multiset. A shared stem needs
one unambiguous drawn source. Expected edges cannot choose a source at a junction.
Captions must belong to their traced routes, whether inline or adjacent. Declared
node-order constraints check LR/RL/TB/TD/BT orientation independently of connectivity.

[Tests](../tests/terminal-meaning.test.ts) perturb real retained output to reverse
arrows, break stems, change topology and detach captions. These are observer
controls, outside the real corpus score. The original four authored demonstration
graphs survive only as historical controls and fixtures.

The bounded observer handles single-cell ASCII labels and supported box/route
glyphs, up to 32 nodes, 512 columns and 256 rows. Unprojected node ownership,
ambiguous merges, shared-stem captions, route ink over caption spaces, ANSI state,
wide/combining text and other families stay unknown. Text admission alone cannot
supply a correctness pass.

[The qualification results](terminal-results-2026-10-31.md) show verified-correct
count ranks for the 16 reviewed drawings. Complete accuracy remains unknown. The full-corpus
accuracy rank is withheld, and unlike CLI/Python boundaries have no shared speed
rank. This profile does not judge typography, spacing, beauty or overall renderer quality.
