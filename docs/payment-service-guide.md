# Paystack payment service

## Checkout and verification

Checkout saves the order, reserves stock and calculates the total in integer South African cents. The order response includes its ID and a private payment token. A retry with the same order-creation key and unchanged details returns the same order and token. Backups must preserve the `integration_secrets` and `order_access` tables together to retain access across a restore.

1. The browser posts the saved order ID and token to `/api/payments/initialize`. The server uses the saved amount and payer email, persists one transaction reference per order, then requests a hosted checkout URL. Concurrent requests to the same server share this operation. Subsequent requests reuse the stored URL.
2. Paystack returns the shopper to `/checkout/payment`. The browser submits the returned reference and the private token to `/api/payments/verify`. The server fetches the transaction and checks the reference, provider transaction ID, email, amount, ZAR currency and account mode.
3. A successful verification or signed charge event records payment, confirms a pending order and queues the receipt, invoice and owner notification in one database transaction. Duplicate events reuse the saved outcome. A payment received after cancellation triggers an owner alert and preserves the cancelled status and released stock. [Paystack transaction verification](https://paystack.com/docs/payments/verify-payments/)

Pending, abandoned and failed payments keep their order and reservation. A request-only order created while Paystack is unconfigured remains available for manual payment recording. When a provider initialization response is lost, retry the saved order. If Paystack reports the reference is already in use and the checkout URL was never saved, look up that reference in the Paystack dashboard before taking another payment.

## Refunds

Start a refund in the Paystack dashboard. The app reconciles Paystack's refund updates and tracks each refund ID once. A processed partial refund leaves the order payment marked paid. Once processed refunds add up to the original total, the payment becomes refunded. The customer receives the amount of each processed refund. Failed refunds notify the customer and owner. A refund requiring attention alerts the owner. [Paystack refund lifecycle](https://paystack.com/docs/payments/refunds/)

Refund events containing a numeric refund ID prompt a server-side lookup of that record. Some events supply only the original transaction reference. In that case the service looks up the order's verified Paystack transaction ID and reads the provider's refund list for that transaction. It applies canonical records individually so equal partial refunds stay distinct. The endpoint returns a retryable error when it awaits charge confirmation, when provider records lag, or when reconciliation exceeds ten pages of 100 results. [Paystack Refund API](https://paystack.com/docs/api/refund/)

## Activation and verification

1. Set the server's `APP_ORIGIN` to the public HTTPS origin. Configure `PAYSTACK_SECRET_KEY` with the test secret key for the South African integration.
2. Register `https://<shop-host>/api/webhooks/paystack` on that integration. Subscribe to `charge.success`, `refund.pending`, `refund.processing`, `refund.needs-attention`, `refund.failed` and `refund.processed` where the endpoint dashboard supports filtering. For a modern signed endpoint, set its signing secret as `PAYSTACK_WEBHOOK_SECRET`. An existing legacy endpoint uses Paystack's signature generated with its secret API key. [Paystack webhook configuration](https://paystack.com/docs/payments/webhooks/)
3. Run `node --test tests/payments.test.mjs tests/provider-signatures.test.mjs` for local checks. In the configured test account, complete a purchase, reload the return page and check the owner order, receipt and invoice. Then issue a partial refund in the Paystack test dashboard and check the recorded amount.
4. Configure the live account's secret key, webhook endpoint and corresponding signing secret on the production host. Start with a fresh live order. Existing attempts retain their original test or live mode.
