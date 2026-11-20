# Backend and owner dashboard

Build a Node 24 / Express API alongside the existing Vite storefront, with a durable SQLite database, private attachments, and an owner-only dashboard at `/admin`. Preserve existing uncommitted navigation changes and the botanical design system.

The dashboard has overview, orders, products and inventory, customers, enquiries, settings, and activity. Metrics are calculated from saved records, with useful empty states. Products are seeded from the existing eight ingredients; stock starts untracked rather than invented. Owners can edit prices, descriptions, formats, availability, and stock. Storefront prices and delivery rules load from the public API. Order totals are calculated independently on the server, tracked stock is reserved transactionally, and cancelled orders restore stock once. Checkout submits an unpaid order request with a reference and idempotency protection. Manual payment recording is explicit; no card processing is implied.

Contact submits validated details and up to five existing supported attachments. Files are stored outside public assets and downloaded only by an authenticated owner. The inbox supports status and internal notes. Customers derive from orders and enquiries. Settings include business contact details, Instagram, and shipping rules.

Owner accounts are created using a terminal command or server environment credentials. No public registration or default password. Use scrypt password hashes, hashed opaque database sessions, HttpOnly SameSite cookies, production Secure cookies, origin/CSRF checks, request limits, rate limits, parameterized SQL, and an audit trail. Secrets and runtime data are ignored by Git. Production requires HTTPS and a persistent disk; database backup/restore instructions accompany the feature.

Remove the footer's circular following-pointer logo by restoring a normal footer region; retain the primary footer wordmark and botanical crest.

Verify authentication and authorization, validation, pricing tampering, duplicate requests, inventory cancellation, uploads and settings with integration tests. Browser-check all dashboard tabs, login/logout, product edits reflected on the storefront, checkout and inbox at 375, 768, and 1280px. Run the full test suite and production build.
