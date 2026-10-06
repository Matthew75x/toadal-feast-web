#!/usr/bin/env python3
from pathlib import Path
from tempfile import TemporaryDirectory
import importlib.util
import unittest

HERE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('hardener', HERE / 'cartridge_hardener.py')
hardener = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hardener)

PROFILE = {
    'game': {
        'protocol': {'name': 'toadal.game', 'version': 1},
        'storage': {'namespace': 'toadal:game:test:v1:'},
    }
}
REQUIRED = ' '.join([
    'toadal.game.v1',
    *hardener.REQ_OUTBOUND,
    *hardener.REQ_INBOUND,
    'toadal:game:test:v1:',
])


class HardenerStaticScanTests(unittest.TestCase):
    def scan(self, body: str):
        with TemporaryDirectory() as td:
            path = Path(td) / 'index.html'
            path.write_text(body, encoding='utf-8')
            return hardener.scan_html(path, PROFILE)

    def test_minimal_closed_runtime_passes_mandatory_scan(self):
        findings = self.scan(f'<!doctype html><div id="x"></div><script>/* {REQUIRED} */</script>')
        self.assertFalse([f for f in findings if f[0] == 'FAIL'], findings)

    def test_external_url_fails(self):
        findings = self.scan(f'<!doctype html><script src="https://cdn.example/x.js"></script><script>/* {REQUIRED} */</script>')
        self.assertTrue(any(code == 'external-url' and sev == 'FAIL' for sev, code, _ in findings), findings)

    def test_root_absolute_reference_fails(self):
        findings = self.scan(f'<!doctype html><img src="/bad.png"><script>/* {REQUIRED} */</script>')
        self.assertTrue(any(code in ('root-path', 'nonclosed-entry') and sev == 'FAIL' for sev, code, _ in findings), findings)

    def test_runtime_network_api_fails(self):
        findings = self.scan(f'<!doctype html><script>fetch("/api");/* {REQUIRED} */</script>')
        self.assertTrue(any(code == 'network-api' and sev == 'FAIL' for sev, code, _ in findings), findings)

    def test_website_storage_namespace_fails(self):
        findings = self.scan(f'<!doctype html><script>/* {REQUIRED} toadal:web:v1: */</script>')
        self.assertTrue(any(code == 'website-storage' and sev == 'FAIL' for sev, code, _ in findings), findings)

    def test_missing_protocol_token_fails(self):
        missing = hardener.REQ_OUTBOUND[0]
        body = REQUIRED.replace(missing, '')
        findings = self.scan(f'<!doctype html><script>/* {body} */</script>')
        self.assertTrue(any(code == 'protocol-token' and missing in detail for _, code, detail in findings), findings)

    def test_bundled_schema_matches_repo_canonical_when_available(self):
        canonical = HERE.parents[1] / 'docs' / 'implementation' / 'game-cartridge.schema.json'
        if not canonical.exists():
            self.skipTest('canonical repository schema not available in standalone tool checkout')
        self.assertEqual(
            canonical.read_text(encoding='utf-8').strip(),
            (HERE / 'schemas' / 'game-cartridge.schema.json').read_text(encoding='utf-8').strip(),
        )


if __name__ == '__main__':
    unittest.main()
