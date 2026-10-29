import importlib.util
import itertools
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "native_validate", Path(__file__).resolve().parents[1] / "validate.py"
)
validation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation)


class SampleIdentityTests(unittest.TestCase):
    def setUp(self):
        self.rows = [
            dict(zip(("id", "api", "phase", "round", "sample"), values))
            for values in itertools.product(
                ["fixture"], ["render"], validation.PHASES, range(3), range(-2, 5)
            )
        ]

    def check(self, rows):
        validation.validate_identities(rows, ["fixture"], ["render"])

    def test_complete_identity_set(self):
        self.check(self.rows)

    def test_duplicate_preserving_row_count_fails(self):
        rows = [dict(r) for r in self.rows]
        for row in rows:
            if row["sample"] >= 0:
                row["sample"] = 0
        with self.assertRaisesRegex(ValueError, "duplicates"):
            self.check(rows)

    def test_missing_and_out_of_profile_fail(self):
        for rows in [self.rows[:-1], self.rows + [dict(self.rows[-1], round=3)]]:
            with self.assertRaises(ValueError):
                self.check(rows)

    def test_invalid_boolean_identity_fails(self):
        rows = [dict(r) for r in self.rows]
        rows[0]["round"] = False
        with self.assertRaises(ValueError):
            self.check(rows)

    def test_legacy_preparation_failure_is_not_measured_call(self):
        self.assertFalse(
            validation.operation_attempted(
                {"status": "error", "error": "page.evaluate: preparation"}
            )
        )
        self.assertTrue(
            validation.operation_attempted({"status": "error", "failed_after_ms": 1})
        )
        self.assertFalse(
            validation.operation_attempted(
                {
                    "status": "error",
                    "measured_call_started": False,
                    "failed_after_ms": 1,
                }
            )
        )


if __name__ == "__main__":
    unittest.main()
