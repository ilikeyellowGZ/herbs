# Cloudflare Implementation Plan

**Goal:** Publish the complete Herby Health application on the existing Cloudflare herbs Worker with persistent store data and private uploads.

**Architecture:** Reuse Express with injected database/file adapters. A named SQLite-backed Durable Object supplies synchronous query and transaction operations; bounded BLOB chunks preserve private uploads without R2. The outer Worker serves built assets and forwards APIs through a Node HTTP bridge with request-local application selection.

**Spec:** docs/superpowers/specs/2026-11-21-cloudflare-design.md

**Constraints:** Preserve concurrent changes, existing Node development, scrypt/CSRF and five-file/10MiB limits. No default credentials, billing changes, public upload bucket, untrusted client-address headers or live test orders. Migrate only through one-time authenticated setup and remove its secret afterwards.

## Tasks

- [ ] Add failing adapter tests covering rollback and private multi-chunk files.
- [ ] Extract shared schema initialisation, inject database/files/client-address support into Express, preserve Node defaults.
- [ ] Implement Durable Object SQL/file adapters, outer asset/API Worker, exact-origin validation, safe request bridge and one-time setup.
- [ ] Add pinned Wrangler, config, deployment and migration scripts, ignore private artifacts.
- [ ] Run unit tests, production build, Wrangler local API/security/commerce/upload/restart checks and browser smoke checks.
- [ ] Snapshot local data, provision/publish Worker, import private data, remove setup secret and verify public health/catalogue/admin/direct pages.
- [ ] Document the live URL, deployment command, existing owner access and recovery procedure; record verification.
