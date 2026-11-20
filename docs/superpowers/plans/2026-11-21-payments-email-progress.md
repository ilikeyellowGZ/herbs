# SDD ledger — plan: docs/superpowers/plans/2026-11-21-payments-email.md

| Interface/task | Check | Ruling |
|---|---|---|
| 1 → 2 | renderEmail(type,payload,brand), mapped order uses cents | Fixed contract in task 1; parent owns all call sites. |
| 2 → 3 | Public checkout/API state, owner logs/replies | Parent coordinates both; public responses never include secret customer data beyond token authorisation. |
| 1 | HTML/text and preview agree with spec | No external fonts/assets required; preview data is fictional. |
| 2 | Transactions, payment verification and queue | Durable outbox written atomically; network occurs outside DB transaction. |
| 3 | Customer and owner lifecycle | Explicit sends only, no private notes emailed. |
| 4 | Verification | Mocked providers until keys exist; no claim of live activation. |

Ruling: Work in the user's current shared workspace and avoid commits/worktree switches — ongoing changes already exist and moving the active app would interfere with the user's workflow. Do not revert others' changes. This is a reversible local implementation and the user's request authorises integration work.

Task 1: pending
Task 2: pending
Task 3: pending
Task 4: pending
