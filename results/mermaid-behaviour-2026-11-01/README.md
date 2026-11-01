# Retained Mermaid behaviour results

49 adapted whole cases from Mermaid tests at `1fb7869866dd619168d840291c9c54b4f129758b`:
30 family/precedence cases and 19 structural SVG naming cases. The corpus retains
all 154 original callback dispositions. [Normal ranked tables](../tables/mermaid-behaviour-1.md)
show observed passes and unresolved work, not whole-library conformance.

`report.json` was produced by replaying actual retained public returns, without
new renderer calls. `receipt.json` binds its ordinary reducer values and inputs.
The unchanged B0 API archive supplies the original raw parents; it is not copied
into another archive. The original callback pass/fail statuses supply no score.

To restore the evidence for the normal readers, from the repository root:

```sh
trident_behaviour_replay=$(mktemp -d)
mkdir "$trident_behaviour_replay/parent-public-tests"
tar -xzf docs/evidence/b0/evidence/public-api-154.tar.gz -C "$trident_behaviour_replay/parent-public-tests"
cp results/mermaid-behaviour-2026-11-01/report.json results/mermaid-behaviour-2026-11-01/corpus.json "$trident_behaviour_replay/"
bun commands.ts results:campaign --campaign "$trident_behaviour_replay" --out FRESH_PUBLICATION_DIR
```

For a new grading epoch, run `mermaid:behaviour --replay-public` on the restored
parent directory. For a new peer, use the native adapter interface documented
in [BENCHMARKS.md](../../BENCHMARKS.md#mermaid-behaviour-tests). Hash checks bind
bytes and identities; independent controls establish only their stated scope.
