# Independent terminal source review

The review read **all 120 literal sources and all 333 original source-fact rows**
at commit `31ff662`, then separately read every changed fact and scope in the
54-case correction at `aef0c9f`. The admitted ledger has **360 facts: 310 required
and 50 advisories**. The [receipt](receipt.json) records a separate meaning note, source hash,
contract hash and review hash for every case. It covers all 17,794 source bytes,
including the 100-node, 195-edge cyclic stress graph. This was a full read, not a
sample or a check that the generator reproduces its own answers.

The review found and resolved three expectation problems:

| Finding | Affected source | Resolved change |
| --- | --- | --- |
| Missing rectangular-shape obligations | 27 all-rectangle flowcharts with explicit shape declarations | Retain every authored shape, even when all shapes are rectangles. Bare implicit nodes can retain their separate default-style policy. |
| Generic declaration used as identity | `terminal:c5455d2e2f5f8672` | Identify the class as `Box`, retain parameter `T` and the original `Box~T~` declaration separately. |
| Starred ER attributes missing key meaning | `terminal:f78157ede4e2d1ab` | Keep original declarations and require the documented primary-key meaning of both starred attributes. |

Two other points needed explicit policy. State and ER global/default directions
were still mandatory; the terminal agent had already identified that they should
be advisories. The repeated `E` inside the Node.js group of
`terminal:22e97a0fc1fff023` refers to the `E[render.lua]` first declared in Neovim.
The finite-corpus policy must explain that a later bare reference does not transfer
ownership to a second group.

Each literal value, label, caption, endpoint, multiplicity, branch/span, membership,
cardinality, date and chart value was compared with its source contract. HTML
entities and authored breaks were read as formatting instructions; Markdown
markers were separated from display text. Class members and ER declarations were
read as source declarations, rather than expected literal display strings. Empty
drawings, implicit participants, cycles, nested states and groups were included.
No other concrete source-to-contract discrepancy was found.

The source policy is Mermaid
[`1fb7869866dd619168d840291c9c54b4f129758b`](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b).
In particular, its
[class documentation](https://github.com/mermaid-js/mermaid/blob/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/docs/syntax/classDiagram.md)
separates generic parameters from class identity, and its
[ER documentation](https://github.com/mermaid-js/mermaid/blob/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/docs/syntax/entityRelationshipDiagram.md)
defines leading `*` as a primary-key notation. Pie's quoted labels and Git's bare
ASCII references were checked against grammar text, without invoking the parser.

All **127 origin occurrences** reproduce the frozen sources. Read-only static
extraction authenticated quoted literals, Mermaid fences, raw files, patch-added
lines and input-before-golden sections. The sole materialized stimulus was also
read directly: Termaid issue 16 constructs the ESC byte with `chr(27)` between two
literal strings. Its exact bytes match the retained source. Origin snapshots and
body hashes passed the existing corpus reader. Static extraction establishes
provenance; it does not establish the expected diagram meaning.

The correction ledger hashes to
`ce222101f36d4d7b71d6b658815c8879c437bcda403acb7f491a3eb8d6a453ac`, matching
the exact delta read before it was committed. Each changed case retains its
previous reviewed contract hash. No source byte changed. All five findings and
policy points are resolved.

The canonical benchmark admits each case only when its source, family, intent
and semantic expectation hash match this completed review. Generated contracts
cannot declare themselves independently reviewed. Changed or missing obligations
remain unknown, while all 120 collection inputs stay present. A later unaudited
intent change cannot remove a known drawing from its denominator. Review wording,
explanatory scope prose and origin annotations do not change this semantic hash.
The full contract hashes remain available for inspection.

This receipt supplies no claim about output correctness, observer completeness
or speed. No renderer, public parser, reference render, candidate AST or
performance collection was used.
