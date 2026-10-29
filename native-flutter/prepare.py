import json, hashlib
from pathlib import Path

root = Path(__file__).parent
r = json.loads((root.parent / "corpus/community-corpus.json").read_text())
cases = r["core"] + [x for x in r["workloads"] if x["id"].startswith("registry:")]
cases += [
    {
        "id": "invalid:syntax",
        "family": "invalid",
        "source": "flowchart TD\nA[broken -->",
        "expectedLabels": [],
    },
    {
        "id": "unsupported:zenuml",
        "family": "zenuml",
        "source": "zenuml\nAlice->Bob: Hello",
        "expectedLabels": ["Alice", "Bob", "Hello"],
    },
]
for c in cases:
    c["sha256"] = hashlib.sha256(c["source"].encode()).hexdigest()
    # Source edits change visible label text, preserve grammar/family.
    labels = c.get("expectedLabels", [])
    label = next(
        (
            s
            for s in labels
            if isinstance(s, str) and s and s in c["source"] and s.isascii()
        ),
        None,
    )
    c["updatedSource"] = (
        c["source"].replace(label, label + " edited", 1)
        if label
        else c["source"] + "\n%% edited"
    )
    c["editLabel"] = label
edits = {
    "core:class80": ("C0", "C0Edited"),
    "core:er40": ("E0", "E0Edited"),
    "core:state80": ("S0", "S0Edited"),
    "registry:flowchart": ("Start", "Start edited"),
    "registry:state": ("submit", "submit edited"),
    "registry:sequence": ("request", "request edited"),
    "registry:timeline": ("Alpha", "Alpha edited"),
    "registry:class": ("logs", "logs edited"),
    "registry:er": ("places", "places edited"),
    "registry:journey": ("Find product", "Find product edited"),
    "registry:architecture": ("Backend", "Backend edited"),
    "registry:xychart": ("Revenue", "Revenue edited"),
    "registry:pie": ("Free", "Free edited"),
    "registry:quadrant": ("Quick win", "Quick win edited"),
    "registry:gantt": ("Implement", "Implement edited"),
    "registry:mindmap": ("Research", "Research edited"),
    "registry:gitgraph": ('"base"', '"base edited"'),
    "registry:radar": ("Speed", "Speed edited"),
    "registry:sankey": ("Coal", "Coal edited"),
    "registry:c4": ("Customer", "Customer edited"),
    "registry:packet": ("Source port", "Source port edited"),
    "registry:kanban": ("Build parser", "Build parser edited"),
    "registry:requirement": ("Respond within 100ms", "Respond within 120ms"),
    "registry:treemap": ("Engineering", "Engineering edited"),
    "registry:ishikawa": ("Manual checks", "Manual checks edited"),
    "registry:block": ("API", "API edited"),
}
for c in cases:
    if c["id"] in edits:
        old, new = edits[c["id"]]
        c["updatedSource"] = c["source"].replace(old, new)
        c["editLabel"] = old
        c["newLabel"] = new
(root / "cases.json").write_text(json.dumps(cases, indent=2))

# Keep the original overwritten-label edit and collect the corrected edit separately.
import copy

visible = copy.deepcopy(next(c for c in cases if c["id"] == "core:tree50"))
visible["id"] = "core:tree50-visible-edit"
visible["updatedSource"] = visible["source"].replace("Node 0", "Node 0 edited")
(root / "visible-edit").mkdir(exist_ok=True)
(root / "visible-edit/cases.json").write_text(json.dumps([visible], indent=2))
print(f"Prepared {len(cases)} main cases and one supplemental edit")
