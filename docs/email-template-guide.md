# Transactional email templates

The server renders each message from the order or enquiry snapshot captured for that event. The same renderer supplies the HTML, plain text and single-line subject.

```js
import { renderEmail } from '../server/email-templates.mjs';

const { subject, html, text } = renderEmail('invoice', { order }, brand);
```

Pass the mapped database order, including its original items, quantities, prices, shipping, subtotal, total, delivery method, customer details and payment status. Amounts use integer ZAR cents. Invoices use `INV-` followed by the unique order reference. The order date uses South African time.

| Events | Required event data |
| --- | --- |
| `order-received`, `invoice`, `order-confirmed`, `order-fulfilled`, `order-cancelled`, `owner-order` | `order` |
| `payment-received`, `payment-failed`, `payment-pending`, `refund-received`, `refund-failed`, `owner-payment` | `order` and verified event details in `payment` (`amount`, `reference`, `status`). For a partial refund, supply the refund amount. |
| `enquiry-received`, `owner-enquiry` | `enquiry` with the sender’s original message and reference |
| `enquiry-reply` | `enquiry` and the owner’s explicit reply in `message` |
| `owner-alert` | `order` and the operational explanation in `notice` |

Supply configured `businessName`, `email`, `phone`, `address` and `origin` in `brand`. Contact fields are optional. The delivery adapter sets the actual Reply-To header. An optional customer `actionUrl` accepts a public HTTPS URL or a path rooted at the configured origin. Loopback HTTP works for local previews. Keep all access credentials out of links. Owner messages derive their links from the configured origin and open Orders or Enquiries in the private dashboard.

## Local preview

Run `node scripts/preview-emails.mjs` and open `artifacts/emails/index.html`. Each of the 16 messages has an HTML page, a text file and a multipart `.eml` file. The generator uses fictional data and writes to the ignored artifacts directory. The dashboard can render the same samples using the exported `emailTypes`, `emailPreviewPayload(type)` and `emailPreviewBrand`.

## Verification

`node --test tests/email-templates.test.mjs` passes eight tests covering the lifecycle, invoice amounts, customer details, explicit replies, escaping, action links, refund copy, owner routing and preview data. The initial six template tests failed against an empty renderer before implementation. Chromium rendered the gallery and all 16 messages at 375, 768 and 1280 pixels without horizontal overflow. Invoice screenshots at each width were inspected. All 16 multipart fixtures decoded to their corresponding text and HTML files. Live mailbox rendering remains unverified.
