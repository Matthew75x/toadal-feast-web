#!/usr/bin/env python3
from pathlib import Path
from tempfile import TemporaryDirectory
import importlib.util
import json
import types
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

    def test_optional_exit_request_requires_confirmation_pair(self):
        body = '<!doctype html><script>/* ' + REQUIRED + ' game:request-exit */</script>'
        findings = self.scan(body)
        self.assertTrue(
            any(code == 'protocol-conditional' and sev == 'FAIL' for sev, code, _ in findings),
            findings,
        )
        findings = self.scan(
            '<!doctype html><script>/* ' + REQUIRED + ' game:request-exit host:exit-confirmed */</script>'
        )
        self.assertFalse(
            any(code == 'protocol-conditional' and sev == 'FAIL' for sev, code, _ in findings),
            findings,
        )

    def test_fullscreen_request_conflicts_with_manifest_false(self):
        with TemporaryDirectory() as td:
            path = Path(td) / 'index.html'
            path.write_text(
                '<!doctype html><script>/* ' + REQUIRED + ' game:request-fullscreen */</script>',
                encoding='utf-8',
            )
            profile = {
                'game': {
                    'protocol': {'name': 'toadal.game', 'version': 1},
                    'storage': {'namespace': 'toadal:game:test:v1:', 'persistence': 'local'},
                    'fullscreen': False,
                }
            }
            findings = hardener.scan_runtime(path, profile, path.parent)
            self.assertTrue(
                any(code == 'fullscreen-contract' and sev == 'FAIL' for sev, code, _ in findings),
                findings,
            )

    def test_tcs_manifest_identity_validation(self):
        game = {'id': 'test-game', 'version': '1.2.3', 'displayName': 'Test Game'}
        good = {
            'schemaVersion': '1.0.0', 'id': 'test-game', 'version': '1.2.3',
            'title': 'Test Game', 'entrypoint': 'index.html',
            'runtime': {'externalConnectOrigins': []},
            'bridge': {'protocol': 'tcs.bridge/1', 'features': []},
        }
        self.assertTrue(hardener.validate_tcs_manifest(game, good)[0])
        bad = dict(good); bad['id'] = 'other-game'
        self.assertFalse(hardener.validate_tcs_manifest(game, bad)[0])
        bad = dict(good); bad['schemaVersion'] = 1
        self.assertFalse(hardener.validate_tcs_manifest(game, bad)[0])

    def test_harden_emits_separate_website_and_tcs_manifests(self):
        from PIL import Image
        with TemporaryDirectory() as td:
            root = Path(td)
            source = root / 'source'
            source.mkdir()
            html = '<!doctype html><div id="x"></div><script>/* ' + REQUIRED + ' */</script>'
            (source / 'game.html').write_text(html, encoding='utf-8')
            Image.new('RGB', (16, 16), 'white').save(source / 'poster.png')
            Image.new('RGB', (16, 16), 'white').save(source / 'shot.png')
            profile = {
                'game': {
                    'id': 'test-game', 'displayName': 'Test Game', 'version': '1.2.3',
                    'publicState': 'PREVIEW', 'entrySource': 'game.html', 'orientation': 'any',
                    'inputs': {'touch': True, 'keyboard': True, 'mouse': True, 'gamepad': False},
                    'storage': {'namespace': 'toadal:game:test:v1:', 'persistence': 'local', 'accountSync': 'none'},
                    'protocol': {'name': 'toadal.game', 'version': 1},
                    'source': {'repository': 'TEST_ONLY', 'ref': 'fixture'},
                },
                'evidence': {'poster': 'poster.png', 'screenshot': 'shot.png'},
                'tcsManifest': {
                    'schemaVersion': '1.0.0', 'id': 'test-game', 'version': '1.2.3',
                    'title': 'Test Game', 'entrypoint': 'index.html',
                    'catalog': {'description': 'fixture', 'category': 'fixture', 'tags': []},
                    'display': {'orientation': 'any', 'aspectRatio': 1},
                    'input': ['keyboard'], 'performance': 'lite',
                    'save': {'schema': {'type': 'object', 'additionalProperties': False, 'properties': {}}, 'maxBytes': 0},
                    'runtime': {'capabilities': ['canvas'], 'externalConnectOrigins': []},
                    'bridge': {'protocol': 'tcs.bridge/1', 'features': []},
                },
            }
            profile_path = root / 'profile.json'
            profile_path.write_text(json.dumps(profile), encoding='utf-8')
            out = root / 'out'
            code = hardener.harden(types.SimpleNamespace(source=str(source), output=str(out), profile=str(profile_path), run_commands=False))
            self.assertEqual(code, 0)
            runtime = out / 'public' / 'games' / 'test-game'
            web = json.loads((runtime / 'cartridge.json').read_text(encoding='utf-8'))
            tcs = json.loads((runtime / 'tcs1.json').read_text(encoding='utf-8'))
            integrity = json.loads((runtime / 'cartridge.integrity.json').read_text(encoding='utf-8'))
            self.assertEqual(web['schemaVersion'], 1)
            self.assertEqual(tcs['schemaVersion'], '1.0.0')
            self.assertEqual(web['id'], tcs['id'])
            self.assertEqual(web['version'], tcs['version'])
            self.assertIn('tcs1.json', [row['path'] for row in integrity['files']])
            self.assertNotIn('audio', web)
            self.assertEqual((runtime / 'index.html').read_bytes(), (source / 'game.html').read_bytes())
            legacy_files = sorted(p.name for p in runtime.iterdir())
            declaration = {
                'mode': 'host', 'contractVersion': 1, 'profile': 'fixture-game', 'profileVersion': 1,
                'eventMessage': 'game:audio', 'hostMessage': 'host:audio', 'fallback': 'local-before-active',
            }
            profile['game']['audio'] = declaration
            (source / 'game.html').write_text(html.replace(' */', ' game:audio host:audio */'), encoding='utf-8')
            source_bytes = (source / 'game.html').read_bytes()
            profile_path.write_text(json.dumps(profile), encoding='utf-8')
            host_out = root / 'host-out'
            code = hardener.harden(types.SimpleNamespace(source=str(source), output=str(host_out), profile=str(profile_path), run_commands=False))
            self.assertEqual(code, 0)
            host_runtime = host_out / 'public' / 'games' / 'test-game'
            host_web = json.loads((host_runtime / 'cartridge.json').read_text(encoding='utf-8'))
            self.assertEqual(host_web['audio'], declaration)
            self.assertEqual((host_runtime / 'index.html').read_bytes(), source_bytes)
            self.assertEqual((source / 'game.html').read_bytes(), source_bytes)
            self.assertEqual(sorted(p.name for p in host_runtime.iterdir()), legacy_files)

    def test_tree_runtime_packages_and_scans_separate_bridge(self):
        from PIL import Image
        with TemporaryDirectory() as td:
            root = Path(td)
            source = root / 'source'
            runtime_source = source / 'runtime'
            runtime_source.mkdir(parents=True)
            (runtime_source / 'index.html').write_text(
                '<!doctype html><script src="bridge.js"></script>', encoding='utf-8'
            )
            (runtime_source / 'bridge.js').write_text(
                '/* ' + REQUIRED + ' */', encoding='utf-8'
            )
            Image.new('RGB', (16, 16), 'white').save(source / 'poster.png')
            Image.new('RGB', (16, 16), 'white').save(source / 'shot.png')
            profile = {
                'game': {
                    'id': 'test-game', 'displayName': 'Test Game', 'version': '1.2.3',
                    'publicState': 'PREVIEW', 'entrySource': 'runtime/index.html', 'orientation': 'any',
                    'inputs': {'touch': True, 'keyboard': True, 'mouse': True, 'gamepad': False},
                    'storage': {'namespace': 'toadal:game:test:v1:', 'persistence': 'local', 'accountSync': 'none'},
                    'protocol': {'name': 'toadal.game', 'version': 1},
                    'source': {'repository': 'TEST_ONLY', 'ref': 'fixture'},
                },
                'runtimePackage': {'mode': 'tree', 'root': 'runtime'},
                'evidence': {'poster': 'poster.png', 'screenshot': 'shot.png'},
            }
            profile_path = root / 'profile.json'
            profile_path.write_text(json.dumps(profile), encoding='utf-8')
            out = root / 'out'
            code = hardener.harden(types.SimpleNamespace(
                source=str(source), output=str(out), profile=str(profile_path), run_commands=False
            ))
            self.assertEqual(code, 0)
            runtime = out / 'public' / 'games' / 'test-game'
            self.assertEqual((runtime / 'bridge.js').read_text(encoding='utf-8'), '/* ' + REQUIRED + ' */')
            integrity = json.loads((runtime / 'cartridge.integrity.json').read_text(encoding='utf-8'))
            self.assertIn('bridge.js', [row['path'] for row in integrity['files']])

    def test_tree_runtime_missing_local_reference_fails_closed(self):
        with TemporaryDirectory() as td:
            root = Path(td)
            (root / 'index.html').write_text(
                '<!doctype html><script src="missing.js"></script>', encoding='utf-8'
            )
            profile = {
                'game': {
                    'protocol': {'name': 'toadal.game', 'version': 1},
                    'storage': {'namespace': 'toadal:game:test:v1:', 'persistence': 'none'},
                }
            }
            findings = hardener.scan_runtime(root / 'index.html', profile, root)
            self.assertTrue(
                any(code == 'nonclosed-entry' and sev == 'FAIL' for sev, code, _ in findings),
                findings,
            )

    def test_bundled_schema_matches_repo_canonical_when_available(self):
        canonical = HERE.parents[1] / 'docs' / 'implementation' / 'game-cartridge.schema.json'
        if not canonical.exists():
            self.skipTest('canonical repository schema not available in standalone tool checkout')
        self.assertEqual(
            json.loads(canonical.read_text(encoding='utf-8')),
            json.loads((HERE / 'schemas' / 'game-cartridge.schema.json').read_text(encoding='utf-8')),
        )


    def test_host_audio_runtime_requires_audio_message_vocabulary(self):
        with TemporaryDirectory() as td:
            root = Path(td)
            path = root / 'index.html'
            profile = {
                'game': {
                    'protocol': {'name': 'toadal.game', 'version': 1},
                    'storage': {'namespace': 'toadal:game:test:v1:', 'persistence': 'none'},
                    'audio': {
                        'mode': 'host', 'contractVersion': 1, 'profile': 'fixture-game',
                        'profileVersion': 1, 'eventMessage': 'game:audio',
                        'hostMessage': 'host:audio', 'fallback': 'local-before-active',
                    },
                }
            }
            path.write_text('<!doctype html><script>/* ' + REQUIRED + ' */</script>', encoding='utf-8')
            findings = hardener.scan_runtime(path, profile, root)
            self.assertTrue(any(code == 'audio-protocol-token' and sev == 'FAIL' for sev, code, _ in findings), findings)
            path.write_text('<!doctype html><script>/* ' + REQUIRED + ' game:audio host:audio */</script>', encoding='utf-8')
            findings = hardener.scan_runtime(path, profile, root)
            self.assertFalse([f for f in findings if f[0] == 'FAIL'], findings)

    def test_host_audio_declaration_rejects_invalid_profile_and_fallback(self):
        with TemporaryDirectory() as td:
            root = Path(td)
            path = root / 'index.html'
            body = '<!doctype html><script>/* ' + REQUIRED + ' game:audio host:audio */</script>'
            path.write_text(body, encoding='utf-8')
            base = {
                'protocol': {'name': 'toadal.game', 'version': 1},
                'storage': {'namespace': 'toadal:game:test:v1:', 'persistence': 'none'},
                'audio': {
                    'mode': 'host', 'contractVersion': 1, 'profile': 'fixture-game',
                    'profileVersion': 1, 'eventMessage': 'game:audio',
                    'hostMessage': 'host:audio', 'fallback': 'local-before-active',
                },
            }
            bad_profile = json.loads(json.dumps(base)); bad_profile['audio']['profile'] = '../escape'
            findings = hardener.scan_runtime(path, {'game': bad_profile}, root)
            self.assertTrue(any(code == 'audio-contract' and sev == 'FAIL' for sev, code, _ in findings), findings)
            bad_fallback = json.loads(json.dumps(base)); bad_fallback['audio']['fallback'] = 'always-local'
            findings = hardener.scan_runtime(path, {'game': bad_fallback}, root)
            self.assertTrue(any(code == 'audio-contract' and sev == 'FAIL' for sev, code, _ in findings), findings)

    def test_schema_host_audio_is_opt_in_and_strict(self):
        valid = {
            'schemaVersion': 1, 'id': 'fixture-game', 'displayName': 'Fixture', 'version': '1.0.0',
            'publicState': 'PREVIEW', 'entry': 'index.html', 'orientation': 'any',
            'inputs': {'touch': True, 'keyboard': True, 'mouse': True, 'gamepad': False},
            'storage': {'namespace': 'toadal:game:fixture-game:v1:', 'persistence': 'local', 'accountSync': 'none'},
            'protocol': {'name': 'toadal.game', 'version': 1},
            'source': {'repository': 'TEST_ONLY', 'ref': 'fixture', 'entrySource': 'index.html'},
            'audio': {
                'mode': 'host', 'contractVersion': 1, 'profile': 'fixture-game', 'profileVersion': 1,
                'eventMessage': 'game:audio', 'hostMessage': 'host:audio', 'fallback': 'local-before-active',
            },
        }
        hardener.jsonschema.validate(valid, hardener.SCHEMA)
        invalid = json.loads(json.dumps(valid)); invalid['audio']['assetUrl'] = 'game-controlled.wav'
        with self.assertRaises(hardener.jsonschema.ValidationError):
            hardener.jsonschema.validate(invalid, hardener.SCHEMA)
        mutations = [
            ('mode', 'shared'), ('contractVersion', 2), ('profile', '../escape'),
            ('profileVersion', None), ('eventMessage', 'game:sound'),
            ('hostMessage', 'host:sound'), ('fallback', 'always-local'),
            ('contractVersion', True), ('profileVersion', True),
        ]
        for field, value in mutations:
            with self.subTest(field=field, value=value):
                invalid = json.loads(json.dumps(valid))
                if value is None:
                    invalid['audio'].pop(field)
                else:
                    invalid['audio'][field] = value
                with self.assertRaises(hardener.jsonschema.ValidationError):
                    hardener.jsonschema.validate(invalid, hardener.SCHEMA)
        legacy = json.loads(json.dumps(valid)); legacy.pop('audio')
        hardener.jsonschema.validate(legacy, hardener.SCHEMA)


if __name__ == '__main__':
    unittest.main()
