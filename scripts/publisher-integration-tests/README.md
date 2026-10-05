# Publisher integration runtime qualification

Run from the website repository:

```powershell
node scripts/run-publisher-integration-tests.cjs
```

The runner executes all fourteen test files with Node's built-in test runner. The prepared r4 source suite passed all 97 tests, including account recovery, conditional legal/audience flow and deferred profile-loading input and canonical required-document regressions. Tests load the actual Studio reference runtime modules. Loader tests load the actual dist loader, and the local progression compatibility test loads the existing dist guest adapter. The operator checks compare all fourteen runtime modules between Studio reference and dist. No runtime modules are copied into the test directory.

The mock Froggy server uses an ephemeral loopback listener and synthetic in-memory test records. It never points at installed or remote staging services. These tests verify runtime behavior; fresh Studio export, browser/CSP, staging integration, and external approval gates require their own receipts.

The original integration kit tests remain intact outside this repository. The kit's three operator checks are adapted here to the actual website runner, loader, and runtime trees.
