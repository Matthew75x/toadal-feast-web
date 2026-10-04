# TOADAL FEAST Web — Guest → Account Migration Contract
**Status:** future capability guardrail; no account backend implied

## Principle
Creating/signing into an account must not silently destroy meaningful guest progress.

## Preconditions before account launch
The account system must define:
- server progression schema/version;
- guest progression import API/flow;
- conflict policy;
- idempotency behavior;
- rollback/error handling;
- user-visible result.

## Migration flow
1. read and validate local guest state;
2. authenticate account;
3. fetch server state;
4. compare schema/version/timestamps;
5. apply explicit merge policy;
6. show migration summary when material;
7. commit server result;
8. only then mark local state migrated.

## Conflict policy
Do not default to blind "server wins" or "client wins."

Each progression domain should define safe behavior, e.g.:
- earned badges/discoveries: union when valid;
- validated game Feat/Title IDs: set union is a candidate policy;
- selected Title: explicit conflict policy; do not silently repurpose selectedBadge;
- completion totals: recompute from accepted IDs rather than trusting a client percentage;
- currencies: server-authoritative merge policy, not naive addition;
- quest completion: period-aware;
- local scores: import only if accepted by future validation rules.

A TOADAL FEAST game projection is not sufficient authority by itself. Before
accepting it, the account service must define accepted manifest versions,
validation/trust rules and deterministic accomplishment de-duplication.

## Idempotency
Retrying migration must not duplicate rewards/currency.

## Failure
On migration failure:
- preserve local guest state;
- do not signpost progress as synced;
- provide retry/recovery.

## Privacy
Do not attach old local guest data to an account before explicit authenticated migration logic is running.

## Current website behavior
Until this exists, account UI must say sync/preservation is planned or coming soon.
