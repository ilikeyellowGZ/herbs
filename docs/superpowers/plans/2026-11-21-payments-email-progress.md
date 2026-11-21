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

Task 1: complete — 16 HTML/text templates, .eml fixtures, preview gallery and owner preview interface. Scoped review fixes restrict customer action links to the store and make enquiry acknowledgements reference-only.
Task 2: complete locally — Paystack signatures/verification/refunds, durable Resend outbox with fenced leases, delivery webhooks, owner reply API and restart-safe reconciliation. No real provider credentials or sends.
Task 3: complete — hosted checkout/return, private invoice access, saved reply composer and notification centre. Recovery preserves additional cart items, retires only matching submission keys and verifies cancelled payment attempts before permitting a fresh checkout.
Task 4: complete for local implementation — 61 Node tests, production/prerender build and 375/768/1280px real-browser journeys passed. Browser journeys use fake providers and check repeated identical purchases, late payment after cancellation, cancelled no-attempt recovery, cross-tab bag changes, invoice download, enquiries/replies, owner logs/previews and application axe checks. Native opaque preview iframe is excluded from app axe traversal; all templates were separately rendered at 375/768/1280px by the template task. Live email client/provider testing remains dependent on user configuration.

Ruling: Provider activation remains external — `.env.local` has been prepared from the example without overwriting any existing file. API keys, verified sending domain, sender/reply-to, notification inbox, public origin and provider webhook setup are not supplied. The app reports readiness honestly; no fake live-connection claim.
