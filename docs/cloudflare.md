# Cloudflare hosting

Website: https://herbs.service-heyywebb.workers.dev  
Owner dashboard: https://herbs.service-heyywebb.workers.dev/admin

The `herbs` Worker serves the built storefront and API from the same HTTPS origin. One named `HerbyStore` Durable Object keeps the SQLite store data, sessions, stock transactions and private attachment chunks. It runs without a local computer or separately hosted Node server. R2 is not required and was not enabled.

## Deploy updates

Use Node 24 or newer. Authenticate with `npx wrangler login` when the local session expires, then run:

```sh
npm ci
npm test
npm run cf:deploy
```

This builds/prerenders the site and publishes Worker code/assets. It preserves the existing Durable Object and its data. Do not remove or rename the `STORE` binding, `HerbyStore` class, migration tags or the named `store` object. Commit application changes with the Wrangler configuration; secrets and data remain outside Git.

For the local Cloudflare runtime, build once and run `npm run cf:dev`. Its isolated data lives in ignored `.wrangler/state`. `npm run dev` continues to use the original Node/SQLite backend and `.local` database. Changes to local data do not automatically change the live store.

## Owner login and first migration

The first migration preserved the local catalogue/settings and created an owner only because there was no existing owner. The generated owner login is in `.local/cloudflare-owner-login.txt`; keep that file private. The owner email defaults to the connected Cloudflare account email unless `CLOUDFLARE_OWNER_EMAIL` is supplied during first setup. No public signup or default password exists.

`npm run cf:setup` is for initial setup only. It backs up the local database, writes a private snapshot, publishes a temporary server-only migration token, deploys, imports data transactionally and removes the token. It refuses to replace an already configured live store. The import is one-time even if a token is accidentally added later. Existing session and rate-limit rows are excluded. Private snapshots and pre-migration SQLite backups are in `.local/cloudflare/` and ignored by Git. Never upload that directory as static assets.

`npm run admin:create -- --reset` operates on the **local** Node database. It does not reset a deployed Cloudflare owner. Live account recovery must use a trusted Cloudflare administration operation or a database recovery procedure; do not rerun first-time setup or replace the live store with a stale local snapshot.

## Persistent storage and recovery

The Durable Object uses Cloudflare's SQLite storage and transactionSync to preserve atomic order/stock operations. Attachments are stored privately in 256KiB BLOB chunks, retaining the existing five-file limit and 10MiB-per-file limit. Downloads require the owner session and are never exposed through the static asset binding. No API/admin response is publicly cached. Normal Cloudflare request/storage quotas apply; monitor usage in Workers & Pages and Durable Objects.

Cloudflare provides SQLite Durable Object point-in-time recovery. Use the Cloudflare account's Durable Object tooling and recovery bookmarks for the named `store` object when restoring live data. The `.local/cloudflare` files are migration-time backups, not ongoing live backups. A routine redeployment does not copy live data back to the local database. See [Cloudflare SQLite storage and recovery documentation](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).

## Payments and email configuration

The deployment retains the backend's current payment/email integration code. Hosting alone does not connect provider accounts. Add server secrets with `npx wrangler secret put NAME` for the provider variables described in `.env.example` and the payment/email guide. Never use a `VITE_` prefix for provider credentials. Resend processing uses persistent Durable Object alarms rather than a continuously running Node timer; jobs keep their retry/idempotency state in SQLite. Signed webhooks remain under `/api/webhooks/paystack` and `/api/webhooks/resend` on the public HTTPS origin.

## Domain and verification

The deployment uses the existing workers.dev address. No unrelated domain in the account was changed. For a future verified custom domain, add it to this Worker and change `vars.APP_ORIGIN` in `wrangler.jsonc` to the exact HTTPS origin before redeploying. Exact origin validation protects browser mutations; do not add wildcard CORS.

`node scripts/qa-cloudflare.mjs` tests isolated local Worker transactions, owner access, CSRF, private uploads, direct routes and cache/security headers. It refuses to run commerce tests against a public hostname. `node scripts/qa-cloudflare-browser.mjs` checks phone/tablet/desktop rendering and owner sign-in locally. The same browser check accepts `CF_QA_URL` for read-only live checks using the private local login file; it creates no live orders or enquiries. Screenshots are saved under ignored `artifacts/cloudflare/`.
