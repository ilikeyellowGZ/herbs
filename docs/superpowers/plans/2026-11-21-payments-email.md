# Paystack and Resend Implementation Plan

**Goal:** Connect verified payments and reliable branded transactional emails throughout the existing shop.
**Architecture:** Server-only provider adapters, SQLite payment attempts and durable email outbox, payment-return React route, owner reply/notification UI. Table-based email templates are independently reusable. No live send/charge without configured account keys.
**Spec:** docs/superpowers/specs/2026-11-21-payments-email-design.md
**Constraints:** ZAR integer cents; no card data; no secrets in VITE variables; preserve existing changes; no unrelated refactor or deployment; one implementation subagent at a time.

## Task 1: Email templates
Own server/email-templates.mjs, tests/email-templates.test.mjs, scripts/preview-emails.mjs and docs/email-template-guide.md. Export renderEmail(type, payload, brand) => {subject,html,text}. payload has order (mapped order shape), enquiry, message, payment, actionUrl and notice; brand has businessName,email,phone,address,origin. Return HTML/text for all lifecycle types named in the spec. Invoices have itemised cents, recipient/delivery, unique INV-order reference, payment status and totals. Escape all untrusted strings and validate optional URLs. Preview script generates a local HTML gallery and .eml-style HTML/text fixtures under artifacts/emails. Start with failing tests, implement, run tests. No app/database or package edits. Parent integrates call sites.

## Task 2: Payment and email services (parent)
Create schema migrations, Paystack adapter/signature verification, payment settlement/refund reconciliation, Resend adapter/outbox worker and signed delivery webhooks. Add API hooks for checkout, callbacks, enquiry acknowledgements/replies and owner status notifications. Test provider fakes and adversarial signatures/amounts/retries before integration. Preserve existing API compatibility when unconfigured.

## Task 3: Storefront and owner UI (parent)
Add hosted-payment checkout/return/recovery, invoice view, owner reply composer/conversation and notification delivery/readiness page. Keep focus/error/empty/disabled/loading states accessible, server state authoritative and keys invisible. Update relevant commercial/privacy/help copy and environment/deployment docs.

## Task 4: Review and verification
Review scoped implementation and whole integration for security, idempotency, transaction boundaries and notification completeness. Run Node suite, build, fake-provider integration browser journeys and visual template QA at 375/768/1280px. Record remaining external activation requirements clearly.
