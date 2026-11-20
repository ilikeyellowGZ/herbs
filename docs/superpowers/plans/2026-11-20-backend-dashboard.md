# Backend and dashboard implementation plan

**Goal:** Connect the storefront to persistent operations and provide an authenticated owner dashboard.

**Architecture:** Express on port 3001, SQLite via node:sqlite, Vite proxy during development and the built storefront served by Express in production. Isolated database, auth, service, API and dashboard modules.

**Spec:** `docs/superpowers/specs/2026-11-20-backend-dashboard-design.md`

- [ ] Add API integration tests covering protected routes, login/CSRF/logout, server prices, stock, idempotency, inbox/uploads, and persistence; run them to establish failure.
- [ ] Add database schema/seeding, scrypt owner CLI, opaque sessions, validation, transactional commerce, private uploads, settings, and activity APIs.
- [ ] Add shared API types and storefront catalogue synchronization. Connect checkout submission and contact attachments; update conflicting preview copy and privacy/help content.
- [ ] Add responsive admin shell, login, overview, orders, product editor, customers, inbox, settings and activity. Reuse existing typography, palette, and accessible controls.
- [ ] Remove the footer following-pointer badge. Document server setup, account creation, deployment, backup and feature boundaries.
- [ ] Run unit/integration tests, production build, dependency audit and browser flows at three widths; resolve observed defects.
