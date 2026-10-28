"""Run: python3 -m unittest discover -s native-flutter/tests -v

Optional real-archive regression: set BENCHMARK_EVIDENCE_ROOT to the retained
campaign directory. Tests never write there; all publications use temporary paths.
"""

import csv
import hashlib
from html.parser import HTMLParser
import importlib.util
import json
import os
from pathlib import Path
import re
import tempfile
import unittest
from urllib.parse import unquote, urlsplit


SPEC = importlib.util.spec_from_file_location(
    "publication", Path(__file__).parents[1] / "publish.py"
)
publication = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(publication)


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value))


def jsonl(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row) + "\n" for row in rows))


def hashes(root):
    return {
        p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in root.rglob("*")
        if p.is_file()
    }


def fixture(root):
    cases = []
    for case, source in (
        ("core:flow5", "flowchart TD\nA-->B"),
        ("invalid:syntax", "flowchart TD\nA["),
        ("unsupported:zenuml", "zenuml\nA->B: Hi"),
    ):
        cases.append(
            {
                "id": case,
                "source": source,
                "sha256": hashlib.sha256(source.encode()).hexdigest(),
                "family": case.split(":")[0],
            }
        )
    save(root / "cases.json", cases)
    for engine, apis in (
        ("flutter", ("MermaidDiagram", "MermaidView", "renderToPng")),
        ("pele", ("render", "mount")),
    ):
        rows = []
        for case in cases:
            for api in apis:
                for phase in publication.PHASES:
                    for round_ in range(3):
                        for sample in range(-2, 5):
                            row = {
                                "id": case["id"],
                                "api": api,
                                "phase": phase,
                                "round": round_,
                                "sample": sample,
                                "release": True,
                            }
                            if case["id"] == "core:flow5":
                                row.update(
                                    status="painted",
                                    painted_pixels=1,
                                    width=100,
                                    height=70,
                                    api_dom_ms=round_ * 5 + sample + 1,
                                )
                            else:
                                row.update(status="error", error="retained rejection")
                                if not (
                                    engine == "pele"
                                    and api == "render"
                                    and phase != "fresh"
                                ):
                                    row["failed_after_ms"] = 1
                            rows.append(row)
        jsonl(root / "results" / engine / "samples.jsonl", rows)
        for api in apis:
            for trial in range(5):
                jsonl(
                    root
                    / "results"
                    / f"first-use-{engine}"
                    / api
                    / str(trial)
                    / "samples.jsonl",
                    [
                        {
                            "id": "core:flow5",
                            "api": api,
                            "phase": "fresh",
                            "sample": 0,
                            "status": "painted",
                            "api_dom_ms": trial + 1,
                        }
                    ],
                )
    save(
        root / "results/visual-findings.json",
        [
            {
                "engine": "flutter",
                "id": "core:flow5",
                "apis": ["MermaidView"],
                "finding": "Representative capture clipped; inspection scope only.",
            }
        ],
    )
    (root / "results/environment.txt").write_text(
        "Wed Oct 28 18:18:43 UTC 2026\n" + "a" * 40 + "\n"
    )
    (root / "results/flutter/core_flow5_MermaidView_fresh.png").write_bytes(
        b"retained-image-bytes"
    )


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        self.urls.extend(value for name, value in attrs if name in ("href", "src"))


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root, self.out = self.base / "archive", self.base / "publication"
        fixture(self.root)

    def test_immutable_copy_exact_counts_and_stats(self):
        before = hashes(self.root)
        result = publication.publish(self.root, self.out)
        self.assertEqual(before, hashes(self.root))
        self.assertEqual(before, hashes(self.out / "evidence"))
        self.assertEqual(result["main"]["raw"], 945)
        self.assertEqual(result["main"]["measured"], 675)
        self.assertEqual(result["main"]["preparation_raw"], 84)
        self.assertEqual(result["main"]["preparation_measured"], 60)
        self.assertEqual(result["total_campaign_observations"], 970)
        with (self.out / "per-case.csv").open() as stream:
            rows = list(csv.DictReader(stream))
        flow = next(
            r
            for r in rows
            if r["id"] == "core:flow5"
            and r["api"] == "render"
            and r["phase"] == "fresh"
        )
        self.assertEqual(flow["n"], "15")
        self.assertEqual(float(flow["median_ms"]), 8)
        self.assertAlmostEqual(float(flow["p95_ms"]), 14.3)
        with (self.out / "first-use.csv").open() as stream:
            self.assertEqual({r["n"] for r in csv.DictReader(stream)}, {"5"})
        self.assertEqual(len(list((self.out / "scorecards").glob("*.md"))), 5)
        md = (self.out / "README.md").read_text()
        self.assertLess(md.index("## Coverage"), md.index("## Outcomes"))
        self.assertLess(md.index("## Outcomes"), md.index("## Cost"))
        self.assertLess(md.index("## Cost"), md.index("## Evidence"))
        self.assertIn("Wed Oct 28 18:18:43 UTC 2026", md)
        self.assertIn("recorded observations, not entrypoint calls", md)
        self.assertIn("84 preparation failures", md)
        self.assertIn("measurement_window", (self.out / "publication.json").read_text())

    def test_affected_cells_qualified_and_errors_not_timing(self):
        publication.publish(self.root, self.out)
        with (self.out / "per-case.csv").open() as stream:
            rows = list(csv.DictReader(stream))
        for row in rows:
            if row["api"] == "render" and row["phase"] == "update":
                self.assertIn("alternating_transition_invalid", row["protocol_flags"])
            if row["api"] == "MermaidView" and row["phase"] == "repeat":
                self.assertIn("legacy_forced_second_frame", row["protocol_flags"])
            if row["negative_input"] == "True":
                self.assertEqual(row["n"], "0")
                self.assertEqual(row["median_ms"], "unavailable")
                if row["api"] == "render" and row["phase"] != "fresh":
                    self.assertEqual(row["preparation_failures"], "15")
                    self.assertIn("not_measured_entrypoint_call", row["protocol_flags"])
            self.assertIn(
                "semantic/fidelity qualification unavailable", row["qualification"]
            )
        self.assertIn(
            "manual finding on representative captures",
            next(
                r["qualification"]
                for r in rows
                if r["api"] == "MermaidView" and r["id"] == "core:flow5"
            ),
        )

    def test_generated_links_and_manifest_resolve(self):
        publication.publish(self.root, self.out)
        for path in [
            self.out / "README.md",
            *list((self.out / "scorecards").glob("*.md")),
        ]:
            for url in re.findall(r"\]\(([^)]+)\)", path.read_text()):
                self.assertTrue(
                    (path.parent / unquote(urlsplit(url).path)).is_file(), (path, url)
                )
        parser = Links()
        parser.feed((self.out / "contact-sheet.html").read_text())
        self.assertGreater(len(parser.urls), 1)
        for url in parser.urls:
            self.assertTrue((self.out / unquote(url)).is_file(), url)
        for line in (self.out / "MANIFEST.sha256").read_text().splitlines():
            expected, relative = line.split("  ", 1)
            self.assertEqual(expected, publication.digest(self.out / relative))

    def test_output_guards_and_missing_metadata(self):
        for out in (
            self.root / "publication",
            self.root,
            Path(publication.__file__).parent / "test-output-not-created",
        ):
            with self.assertRaises(ValueError):
                publication.publish(self.root, out)
            if out != self.root:
                self.assertFalse(out.exists())
        publication.publish(self.root, self.out)
        with self.assertRaises(ValueError):
            publication.publish(self.root, self.out)
        metadata = json.loads((self.out / "publication.json").read_text())["metadata"]
        self.assertEqual(metadata["flutter_version"], "unavailable")
        self.assertEqual(metadata["browser_runtime"], "unavailable")

    def test_bad_source_hash_and_contradictory_join_rejected(self):
        cases = json.loads((self.root / "cases.json").read_text())
        cases[0]["source"] = "changed source"
        save(self.root / "cases.json", cases)
        with self.assertRaisesRegex(ValueError, "Source hash mismatch"):
            publication.publish(self.root, self.out)
        fixture(self.root)
        row = publication.read_rows(self.root / "results/pele/samples.jsonl")[0]
        row.update(engine="pele", campaign="pele", api_dom_ms=999)
        jsonl(self.root / "results/joined-samples.jsonl", [row])
        with self.assertRaisesRegex(ValueError, "contradicts raw"):
            publication.publish(self.root, self.out)
        self.assertFalse(self.out.exists())

    @unittest.skipUnless(
        os.environ.get("BENCHMARK_EVIDENCE_ROOT"),
        "set BENCHMARK_EVIDENCE_ROOT for retained campaign",
    )
    def test_retained_campaign(self):
        root = Path(os.environ["BENCHMARK_EVIDENCE_ROOT"])
        before = hashes(root)
        result = publication.publish(root, self.out)
        self.assertEqual(before, hashes(root))
        self.assertEqual(result["total_campaign_observations"], 10105)
        self.assertEqual(result["main"]["raw"], 9765)
        self.assertEqual(result["supplemental"]["raw"], 315)
        self.assertEqual(result["first_use"]["raw"], 25)
        self.assertEqual(result["main"]["preparation_raw"], 84)
        self.assertEqual(result["main"]["preparation_measured"], 60)
        with (self.out / "per-case.csv").open() as stream:
            rows = list(csv.DictReader(stream))
        flow = next(
            r
            for r in rows
            if r["id"] == "core:flow5"
            and r["api"] == "MermaidDiagram"
            and r["phase"] == "fresh"
            and r["stage"] == "raster_complete_ms"
        )
        self.assertEqual(flow["n"], "15")
        self.assertAlmostEqual(float(flow["median_ms"]), 16.512)


if __name__ == "__main__":
    unittest.main()
