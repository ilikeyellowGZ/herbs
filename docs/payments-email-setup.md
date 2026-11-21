# Paystack and Resend setup

The shop has server-side Paystack checkout, verified payment/refund updates, Resend transactional delivery, a durable email outbox, an owner reply composer and branded HTML/plain-text email templates. No account keys were present during implementation. Provider requests are covered by local fakes; live charging and delivery remain inactive until you configure the accounts below.

## Environment

Copy `.env.example` to `.env.local` if that file does not exist. Keep `.env.local` private; it is ignored by Git. On the production host use its private environment-variable configuration. Never put any provider secret in a `VITE_` variable or browser code.

| Variable | Value |
|---|---|
| `APP_ORIGIN` | The public HTTPS store origin, without a trailing path. For local development use `http://localhost:5174`. |
| `PAYSTACK_SECRET_KEY` | Start with your Paystack `sk_test_…` key. Use `sk_live_…` only after account activation and test verification. |
| `PAYSTACK_WEBHOOK_SECRET` | Modern `whsec_…` signing secret for the matching Paystack environment. If omitted, legacy `x-paystack-signature` is checked using the API secret. |
| `RESEND_API_KEY` | A private Resend API key with permission to send transactional emails. |
| `EMAIL_FROM` | A sender on your Resend-verified domain, for example `Herby Health <orders@your-domain>`. |
| `EMAIL_REPLY_TO` | A monitored customer-support inbox. Falls back to the store contact email or sender address. |
| `NOTIFICATION_EMAIL` | The inbox for new orders, payment changes, enquiries and exceptions. Falls back to the configured store contact or owner login email. |
| `RESEND_WEBHOOK_SECRET` | The Resend webhook endpoint's `whsec_…` signing secret. |

Restart `npm run dev` or `npm start` after changing server variables. `npm run dev` starts the API and Vite together. Production needs Node 24+, persistent private `DATA_DIR` storage, HTTPS, a configured owner account and a reverse proxy/public origin that reaches the API. Configure the verified business/contact/address details in Dashboard → Settings; templates omit missing details and do not invent VAT registration information.

## Paystack dashboard

1. Activate a Paystack account that supports your South African business and ZAR. Work in test mode first.
2. Set the webhook URL to `https://YOUR-STORE/api/webhooks/paystack` and callback URL to `https://YOUR-STORE/checkout/payment`. The server also sends the callback URL when creating checkout.
3. Add the API and signing secrets for that same environment. Modern signed webhooks use a five-minute timestamp window; keep the host clock synced. When the modern signing secret is configured, the application rejects legacy-only signatures rather than downgrading.
4. Exercise a complete test purchase, failed/abandoned payment and a refund from the Paystack dashboard. Orders become paid only after a matching provider status, amount, currency, payer and environment. Verify the receipt, invoice and owner notification in the notification centre.
5. Move to the live key and live webhook configuration only when ready. Do not switch a pending test order to a live payment: start a new live order. Card details are entered on Paystack and are never stored by this application.

The callback reference alone is not proof of payment. Browser verification also needs a private per-order token. Signed webhooks settle an order if the customer closes the browser. A late successful payment on a cancelled order alerts the owner without reopening it. Cancellation does not initiate a refund; perform actual refunds in Paystack. Signed refund notifications are reconciled with provider records, including partial refunds. The dashboard prevents manually overwriting a provider-managed payment.

ID-less refund signals schedule durable provider-list follow-up for up to 72 hours, even when an older equal partial refund initially matches the signal. Canonical refund IDs keep notifications and cumulative totals idempotent. Node uses the service timer; Cloudflare uses Durable Object alarms. A job that reaches its follow-up window alerts the owner for reconciliation. Payment return status can recover the saved provider reference after a lost initialise response; it verifies a known payment attempt before treating a cancelled order as unpaid.

If the first successful initialise response is lost and Paystack refuses to reuse that transaction reference, reconcile it in Paystack before creating another order. The application preserves one reference and will not silently create another charge. See [payment-service-guide.md](payment-service-guide.md).

## Resend dashboard

1. Add a domain you control and publish the exact DNS records Resend supplies. Wait for domain verification; do not invent SPF/DKIM values. Use a dedicated transactional subdomain if appropriate.
2. Create the API key and configure `EMAIL_FROM`, `EMAIL_REPLY_TO` and `NOTIFICATION_EMAIL`.
3. Create the webhook endpoint `https://YOUR-STORE/api/webhooks/resend`. Subscribe to `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.failed`, `email.bounced`, `email.complained` and `email.suppressed`. Add its signing secret to the server environment.
4. Open Dashboard → Notifications. Confirm the configured sender and owner inbox, inspect template previews, then run a controlled test order/enquiry with addresses you own. Check real email clients as well as the browser previews.

The queue saves each event with the business transaction and delivers it independently. A mail outage does not discard an order or enquiry. The worker runs once a second, retries transient failures with backoff and keeps exact request bodies and idempotency keys. `sent` means provider acceptance, not inbox delivery. The delivery webhook supplies delivered/bounce/complaint status. Bounced/complained recipients are suppressed. An ambiguous attempt older than 23 hours is marked `uncertain` and requires reconciliation in Resend; the system does not blindly retry beyond the provider's 24-hour idempotency window.

Owner replies are explicit sends from Dashboard → Enquiries. Reply text is saved with the conversation. Internal notes are never emailed. The customer enquiry acknowledgement contains only its receipt/reference, preventing the public form from relaying arbitrary message content. The original enquiry appears in the private owner notification/inbox. Attachments remain private downloads; they are not copied into outgoing emails.

## Templates and invoices

Run `npm run emails:preview` to generate `artifacts/emails/index.html`, individual HTML/text previews and multipart `.eml` fixtures. The [template guide](email-template-guide.md) lists all lifecycle messages and their rendering interface. Dashboard → Notifications previews templates and saved messages in a sandboxed iframe.

Customers receive itemised invoice email when payment is verified, or an unpaid invoice for request-only ordering if Paystack is not configured. A verified order can also download a printable HTML invoice from its payment-return page. Owners can view/print invoices from Orders. Amounts use recorded integer ZAR cents; no VAT rate or registration number is invented. Confirm the business's legal invoice requirements before public trading.

## Verification commands

```sh
npm test
npm run build
npm run emails:preview
node scripts/qa-payments-email.mjs
```

The last command creates an isolated temporary store with fake provider responses and checks the complete local payment/email/owner-reply journey in a real browser. It sends no external email and charges no money. Operational backups include the database, outbox and private enquiry files; continue using `npm run backup` and protect its output.

## Official references

- [Paystack transactions: initialise and verify](https://paystack.com/docs/api/transaction/)
- [Paystack webhook verification](https://paystack.com/docs/payments/webhooks/)
- [Paystack refunds and notifications](https://paystack.com/docs/payments/refunds/)
- [Resend verified sending domains](https://resend.com/docs/dashboard/domains/introduction)
- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)
