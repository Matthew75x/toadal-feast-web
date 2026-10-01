# ARC-QUAL-01 evidence preservation note

This note accompanies preservation of the pre-existing WO-003 working-tree delta from base `409a6d223a148937aa15073b5640379560594b89` on `work/WO-003-arcade-isolation-20260930`.

This commit records existing harness/protocol work, Classic runtime assets, and qualification evidence. It adds no new Arcade qualification or website integration, and it does not change the existing `ARCADE HOLD` disposition. Do not treat file presence, protocol code, or partial witnesses as qualification acceptance; resume only the explicitly outstanding ARC-QUAL-01 gaps in the task record.

The external QA-only driver is deliberately not included in candidate cartridge bytes. Its SHA-256 remains `A2E7DE0AD2622871ED1E53E90DCEA82C1FC892DC124CA4E1DD4241BB36892127`. Evidence retains this digest while omitting its local absolute path. The runtime replay script now requires an explicit `--bot` path, avoiding machine-specific defaults and making the external-tool boundary clear.

The five added Classic images live under the isolated `reference/audit/arcade-standard-6daedca1` qualification tree. This preservation commit does not claim that the exact final cartridge was requalified after any later package change.
