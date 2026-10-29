# Bounded adversarial output and scope review

Verdict: no concrete semantic blocker found for the frozen common-13 PNG task. All seven participants visibly represent the same required source facts on those inputs. The point ranking is supportable only with the scope and uncertainty limits below. This does not certify general Mermaid compatibility or renderer/widget performance.

This report is the output-review component of the parent’s two-agent audit: this reviewer assessed outputs and scope, and Russell independently assessed statistics. This reviewer performed semantic, artifact-integrity, and claim-scope passes without subdelegating; those passes are not separate agents. No benchmark was run, no source/evidence artifact was changed, and no publication or external message occurred. The only campaign write is this requested report; temporary comparison crops were created under /tmp/seven-output-audit.

## Evidence and verification

Read review.json, campaign-plan.json, summary.json, qualification-client/profile.json and rows.jsonl, measurement/context.json and rows.jsonl, and relevant export-worker code. Visually inspected all 91 common qualification outputs as seven-participant comparison sheets cropped from the current PNGs without resizing; also inspected docs/evidence/seven-png/painted-contact.png and timing.png. Compared against the actual source strings in profile.json, rather than relying on generic pass reasons.

Independently decoded all 145 returned qualification PNGs with Pillow: all are 1200×900, fully opaque, and match review.json's decoded RGBA hashes. Independently computed actual nonwhite bounds for all 91 common outputs: each fits inside the 30-pixel margin. White surrounding canvas and readable source facts were visible in the comparisons. This verifies current artifacts; it does not independently prove the complete historical review process for the 84 reused images.

The eligible review set, plan's eligibleBeforeTiming, and summary's commonCases agree exactly on 13 inputs. The plan's reviewSha256 matches the current review file. Measurement context records the same render identity, CPU affinity 2 and cgroup quota 100000/100000. All 5,460 measured row records have status ok and recorded pixel hashes matching the qualified participant/case; there are 3,640 warmup records and no excludedAfterTiming cases. Measurement PNGs were not independently decoded in this bounded pass; their hash consistency here is a check of the retained records.

## Actual source-fact checks

Every row below passed visual checking for all seven participants. IDs identify qualification-client/png/<id>.png. Column order is M / AM / BM / ZM / Dart / Flutter / Pele. Case paths share packages/mermaid/src/docs/syntax/.

| Case | Required facts observed | PNG IDs in participant order |
| --- | --- | --- |
| flowchart.md:85 | Start→Stop, two boxes, top-to-bottom. | s000094 / s000048 / s000117 / s000002 / s000025 / s000140 / s000071 |
| flowchart.md:92 | Start→Stop, two boxes, left-to-right. | s000095 / s000049 / s000118 / s000003 / s000026 / s000141 / s000072 |
| flowchart.md:1449 | Five nodes; Hard edge→Round edge→Decision; One/Two reach the correct results; decision diamond and rounded node retained. | s000098 / s000052 / s000121 / s000006 / s000029 / s000144 / s000075 |
| sequenceDiagram.md:7 | Three ordered messages: solid closed Alice→John, dashed closed John→Alice, solid open async Alice→John; all message labels retained. | s000102 / s000056 / s000125 / s000010 / s000033 / s000148 / s000079 |
| sequenceDiagram.md:89 | Box participants; Bob→Alice Hi Alice, then Alice→Bob Hi Bob. | s000103 / s000057 / s000126 / s000011 / s000034 / s000149 / s000080 |
| sequenceDiagram.md:101 | Actor roles distinct from participant boxes; Alice→Bob Hi Bob, then Bob→Alice Hi Alice. | s000104 / s000058 / s000127 / s000012 / s000035 / s000150 / s000081 |
| sequenceDiagram.md:189 | Aliases display Alice/John; both messages solid closed arrows, with the response John→Alice. | s000105 / s000059 / s000128 / s000013 / s000036 / s000151 / s000082 |
| classDiagram.md:142 | Animal isolated; Car inherits Vehicle; empty triangle points to Vehicle. | s000106 / s000060 / s000129 / s000014 / s000037 / s000152 / s000083 |
| classDiagram.md:180 | Public owner:String and balance:BigDecimal; public deposit(amount) and withdrawal(amount); all inside BankAccount. | s000107 / s000061 / s000130 / s000015 / s000038 / s000153 / s000084 |
| stateDiagram.md:26 | All six transitions: initial→Still, Still→final, Still→Moving, Moving→Still, Moving→Crash, Crash→final. | s000109 / s000063 / s000132 / s000017 / s000040 / s000155 / s000086 |
| stateDiagram.md:132 | s1→s2 with A transition label. | s000110 / s000064 / s000133 / s000018 / s000041 / s000156 / s000087 |
| stateDiagram.md:142 | Filled initial→s1→bullseye final; initial/final distinct. | s000111 / s000065 / s000134 / s000019 / s000042 / s000157 / s000088 |
| entityRelationshipDiagram.md:251 | PERSON contains string firstName, optional string? middleName, string lastName. | s000113 / s000067 / s000136 / s000021 / s000044 / s000159 / s000090 |

For state26, Mermaid/Dart/Flutter/Pele share a termination marker while AM/BM/ZM use separate termination markers. Both terminal transitions remain visible. Accepting either is consistent with the source and pinned Mermaid oracle; counting final-marker glyphs would incorrectly reject equivalent outputs. BM's different layout still retains the two directions between Still and Moving.

AM/BM/ZM person icons preserve the actor role in sequence101, while sequence89 uses participant boxes. Literal stick figures are unnecessary under the clarified contract. The async open arrow in sequence7 is distinguishable from its closed arrows, and the dashed reply remains dashed. Class142 retains the empty inheritance triangle. BankAccount member types, public signs, methods and parameter names are visible, including the smaller native Dart/Flutter text. PERSON's optional-type question mark is visible across all seven.

There is no evidence here for equal visual quality: sizes, spacing, node geometry and line routing vary. AM/BM sequence101 places actor names close to the first message line; the text remains readable, but this example cannot support a claim of uniformly polished layout. Small role-specific text remains a legibility judgment at native scale, not an accessibility certification.

## Required claim limits and concrete evidence

1. **Keep timing and coverage scopes explicit.** The common set is 3 flowcharts, 4 sequences, 2 classes, 3 state diagrams and 1 ER attribute example: five families, 13 fixed short reviewed inputs. It excludes the control, mindmap, BM's failing decision loops/groups, class composition/aggregation test, and ER relationship/cardinality test. Timing therefore says nothing about those omitted tasks. In particular, flowchart1449's decision diamond passes; that does not rehabilitate the excluded decision-loop cases or the class relationship diamonds.

2. **548 is mechanical coverage only.** summary.coverage explicitly says this. Mechanical PNG successes are M 492, AM 320, BM 218, ZM 228, Dart 414, Flutter 414, Pele 510, each from 548 attempts. These counts must not become semantically correct/rendered-equivalently counts. The source-fact review in this report is confined to common-13.

3. **Name the complete client pipeline near the ranking.** summary.metric correctly measures dispatch through binary PNG consumption in Node. Dart is native AOT source/layout/SVG plus a Chromium PNG converter, not an entirely native PNG pipeline. Flutter is native Linux release renderToPng followed by intrinsic-PNG decoding, fixed-canvas drawing and a second PNG encoding: flutter_worker.dart lines 73, 81, 97 and 111 show these stages. This cost is valid for the declared export contract. The Flutter score (87.11 ms) cannot establish slower widget frames or renderer-only work; its reported median normalization time is 73.976 ms. Driver IPC, binary delivery, rasterization and encoding also affect scores. Neither API-only timings nor normalization medians can be substituted for the ranked client metric.

4. **Describe observed ranks, with unresolved pairs.** The reported order is Dart 12.12 ms, Pele 12.22, ZM 20.46, BM 20.63, AM 30.35, M 53.08, Flutter 87.11. Pele/Dart ratio CI is 0.9594–1.0597; BM/ZM is 0.9681–1.0476. Neither pair has an established ordering. Intervals are unadjusted pairwise 95% launch-block bootstrap intervals over fixed cases; they do not establish a simultaneous seven-way statistical order or generalization to other inputs/machines. summary.json already states this, and timing.png explicitly flags both unresolved pairs. Preserve those statements wherever the ranking is reused.

5. **Equal requested font settings do not mean equal typography/work.** Inter base 14 is requested; public role defaults and differing actual sizes are permitted. painted-contact.png visibly shows the smaller Dart/Flutter class output and varying member typography. Source facts are readable, which supports the contract, but the evidence cannot support identical text size, identical painted area, equal raster/encoding work, or an isolated algorithm comparison.

6. **The chart needs accompanying pipeline/context text when shared.** timing.png accurately identifies common-13, client time, repetitions, bootstrap error bars and unresolved pairs. It does not itself identify CPU2/one-CPU cgroup, Dart's Chromium bridge, Flutter's double encoding, the fixed 1200×900 contract, or the mechanical-only status of 548 coverage. Supply these in an adjacent caption/body if presenting it as the benchmark result. painted-contact.png demonstrates only class180; it is illustrative evidence, not proof of all common inputs. This is a presentation limit, not a reason to discard the qualified outputs.

## Minor evidence wording issue

review.json's inherited Mermaid sequence189 reason ends “Manifest incorrectly says the reply is dashed.” The current qualification-client/profile.json actually says “solid closed-arrow” and the source is J->>A. The current output is correct; the inherited historical remark is stale and should not be treated as an outstanding semantic discrepancy. No edit was made in this audit.

No new benchmark or output changes are required by the source-fact findings above. Retain the listed limits in the result narrative. This report does not claim a full code/statistical-method audit, continuous verification of isolation throughout every launch, or independent semantic validation of the full corpus.
