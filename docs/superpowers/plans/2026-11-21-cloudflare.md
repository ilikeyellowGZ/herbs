# Cloudflare Implementation Plan

**Goal:** Publish the complete Herby Health application on the existing Cloudflare herbs Worker with persistent store data and private uploads.

**Architecture:** Reuse Express with injected database/file adapters. A named SQLite-backed Durable Object supplies synchronous query and transaction operations; bounded BLOB chunks preserve private uploads without R2. The outer Worker serves built assets and forwards APIs through a Node HTTP bridge with request-local application selection.

**Spec:** docs/superpowers/specs/2026-11-21-cloudflare-design.md

**Constraints:** Preserve concurrent changes, existing Node development, scrypt/CSRF and five-file/10MiB limits. No default credentials, billing changes, public upload bucket, untrusted client-address headers or live test orders. Migrate only through one-time authenticated setup and remove its secret afterwards.

## Tasks

- [x] Add failing adapter tests covering rollback and private multi-chunk files.
- [x] Extract shared schema initialisation, inject database/files/client-address support into Express, preserve Node defaults.
- [x] Implement Durable Object SQL/file adapters, outer asset/API Worker, exact-origin validation, safe request bridge and one-time setup.
- [x] Add pinned Wrangler, config, deployment and migration scripts, ignore private artifacts.
- [x] Run unit tests, production build, Wrangler local API/security/commerce/upload/restart checks and browser smoke checks.
- [x] Snapshot local data, provision/publish Worker, import private data, remove setup secret and verify public health/catalogue/admin/direct pages.
- [x] Document the live URL, deployment command, existing owner access and recovery procedure; record verification.

## Verification and deployment

Published to https://herbs.service-heyywebb.workers.dev, Worker version `0698216c-a8f6-4fe5-9897-cbc8a966a8ad`. Initial import succeeded and Wrangler confirmed deletion of MIGRATION_TOKEN; the secret list is empty and the setup URL returns 404. Live health returns 200, the public catalogue contains eight products, anonymous admin API access returns 401, owner sign-in uses Secure/HttpOnly cookies, and API/admin/payment-return responses use no-store. Direct collection/product/help routes and payment return serve successful HTML responses. No account domains or billing settings were changed.

The local database contained no owner, orders or enquiries. A random-password owner was created with the connected account email, service.heyywebb@gmail.com. Credentials are in ignored `.local/cloudflare-owner-login.txt`; private snapshots and SQLite backups are in `.local/cloudflare/`. These files were not uploaded as assets or committed. Local Cloudflare QA records stayed in `.wrangler/state` and were not migrated.

`npm test`: 55 passed, zero failed. Production build and Wrangler dry run passed. Native dependency audit reported zero vulnerabilities. Cloudflare-runtime QA passed SQL bindings/rollback, owner auth, origin/CSRF, stock reservations, duplicate request handling, multi-chunk private upload/download, direct routes, sign-out and headers. Restarting the local runtime preserved its store. Real Edge browser checks passed storefront/collection/admin at 375/768/1280px locally and on the final public deployment, with no console/hydration errors. Screenshots are in artifacts/cloudflare.

The compatibility date is deliberately pinned to 2026-11-20: Cloudflare rejected 2026-11-21 as future at setup time. Workers' SQL authorizer rejects PRAGMA user_version, so the shared schema keeps that pragma only for native Node SQLite. Notification retries use persistent Durable Object alarms. Provider return `/checkout/payment` uses the private app shell with a 200 response and no-store.

Payment and email account keys remain absent, confirmed by live integration readiness. Provider integration code is deployed, but hosting does not activate those services; the existing request-only order path remains available. See docs/cloudflare.md for deployment, secrets and recovery.
