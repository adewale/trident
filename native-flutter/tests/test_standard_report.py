"""Historical campaign identities survive the Dart/Flutter brand split."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('standard_report', Path(__file__).parents[1] / 'standard-report.py')
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)

def row(identity):
    return {'format': 'png', 'metrics': {'implementation': identity}}

class NativeIdentityTests(unittest.TestCase):
    def test_legacy_identity_is_retained(self):
        self.assertEqual(report.native_project_id([row('orestesgaolin/mermaid')]), 'orestesgaolin/mermaid')

    def test_new_brand_keeps_its_own_identity(self):
        self.assertEqual(report.native_project_id([row('pub:mermaid_flutter')]), 'pub:mermaid_flutter')

    def test_mixed_or_missing_identities_are_not_silently_reduced(self):
        for observations in [[], [row('orestesgaolin/mermaid'), row('pub:mermaid_flutter')]]:
            with self.assertRaises(ValueError):
                report.native_project_id(observations)
