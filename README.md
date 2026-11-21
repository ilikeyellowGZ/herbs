# Herby Health — After Dark

React, TypeScript and Vite storefront following [DESIGN herbs.md](<DESIGN herbs.md>).

## Backend and owner dashboard

Requires **Node.js 24+**. Express and the built-in SQLite driver provide durable storage without a separate database service. Runtime data is private and ignored by Git.

```sh
npm install
npm run admin:create
npm run dev
```

The account command prompts for an owner email and a hidden password of 12–128 characters. There is no default password or public sign-up. Open **http://localhost:5174/admin**. `npm run dev` starts the API on 3001 and Vite on 5174; Vite forwards `/api` to the API. If Vite is already running, start only `npm run dev:api`.

- **Overview:** real order counts, manually recorded revenue, pending orders, open enquiries, seven-day order history and low-stock alerts.
- **Orders:** search, status filters, customer/delivery details, recorded prices, internal notes, confirmation/fulfilment/cancellation, manual payment records and CSV export. Cancellation restores reserved stock once.
- **Products:** edit the existing eight ingredients. Stock starts untracked; blank means untracked and zero means sold out. Tracked units are reserved transactionally on order submission.
- **Customers:** contacts grouped by email from orders and enquiries, with counts and recorded paid totals; searchable and exportable.
- **Enquiries:** private messages and attachments, status, internal notes, authenticated downloads and CSV export. Reply opens your email app and does not send automatically.
- **Settings:** business contacts, Instagram, courier fee, free-delivery threshold and collection availability. Storefront settings refresh after saves and on returning to the tab.
- **Activity:** owner access and record changes. Passwords and tokens are never logged.

Checkout independently calculates prices and shipping, rejects changed totals or unavailable stock, and returns an unpaid request reference. Idempotency keys prevent repeated submissions of the same request. No card details are collected. Marking an order paid/refunded records an externally verified transaction only.

Contact accepts up to five supported files of at most 10 MiB each, validates size/type/signatures, and stores random filenames outside public assets. Downloads require an owner session and are served as attachments. No automatic confirmation emails are sent. The footer's circular following-pointer logo has been removed; its crest and wordmark remain.

### Server configuration

Copy `.env.example` to `.env.local` for local settings. `ADMIN_EMAIL` and `ADMIN_PASSWORD` optionally bootstrap the first account; they are server-only and ignored after an account exists. Prefer interactive creation and remove bootstrap credentials afterwards. Reset with `npm run admin:create -- --reset`; this revokes that owner's sessions.

The complete site is hosted on Cloudflare at **https://herbs.service-heyywebb.workers.dev**, with the owner dashboard at **/admin**. Run `npm run cf:deploy` to build and publish updates without replacing live store data. See [Cloudflare hosting and recovery](docs/cloudflare.md) for storage, private owner access, local Cloudflare testing, migration backups and provider secrets.

For a separate Node production server, build with `npm run build`, set `NODE_ENV=production`, set `APP_ORIGIN` to the exact public HTTPS origin, and run `npm start`. Express serves both the built app and API. Keep `HOST=127.0.0.1` behind an HTTPS reverse proxy, or use your platform's required bind address. Put `DATA_DIR` on a persistent disk outside public assets and source control. The Node server is intended for one process; static hosting alone cannot run it. Cloudflare uses the durable storage adapters described in the hosting guide.

Owner access uses scrypt hashes, hashed opaque database sessions, HttpOnly/SameSite cookies, Secure production cookies, eight-hour expiry, CSRF tokens, origin checks and request limits. API responses and owner pages are not cacheable or indexable. Limits use the direct connection address; configure proxy-aware limits before scaling behind a shared proxy.

Configure verified business contacts and confirm labels, prices, delivery arrangements, privacy contact and retention procedures before public operation. Automated retention and external payment/email providers are not configured.

### Backup and restore

Run `npm run backup` for a consistent SQLite snapshot plus private uploads in `DATA_DIR/backups/<timestamp>/`. Prefer a maintenance window with no new enquiries to keep records and files aligned. Keep backups private and copy them to separate durable storage.

Restore with the server stopped: preserve the current data directory, put the backup `herby.sqlite` and `uploads` in a clean `DATA_DIR`, then restart. Do not mix the restored database with old SQLite WAL/SHM files. Reset owner credentials afterwards to revoke restored sessions.

### Backend verification

```sh
npm test
npm run build
npm run qa:admin
npm audit --omit=dev
```

`qa:admin` runs an isolated server/database and installed Edge on Windows (Chrome elsewhere; override `QA_BROWSER`). It checks all dashboard tabs, login/logout, editing, storefront updates, checkout, private inbox downloads, accessibility and overflow at 375/768/1280px. Temporary test records never touch store data. Screenshots are in ignored `artifacts/admin/`. Use Express with a matching `APP_ORIGIN` for connected form checks. Earlier preview-only form/cursor assertions in legacy scripts are superseded by `qa:admin`.
Tailwind CSS v4 and shadcn/ui registry configuration are available through `components.json` and the `@/` source alias. The footer uses the native cursor; its circular following-pointer logo has been removed. The original crest and wordmark remain.
All photographs come from the supplied project files. No new imagery was generated.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5174. The development server uses port 5174 and stops if that port is already in use.

Production and checks:

```sh
npm run build
npm test
npm run preview -- --port 4173
python scripts/qa.py
```

The browser check requires Python Playwright and its Chromium installation.

## File organisation

| Folder | Contents |
| --- | --- |
| `src/pages/` | Homepage and individual ingredient pages |
| `src/components/` | Header, cards, image rendering, ingredient details and enquiry form |
| `src/data/catalogue.mjs` | Eight ingredients and enquiry preparation |
| `src/data/images.json` | Runtime image paths, responsive candidates, dimensions and alt text |
| `assets/herby-health/products/` | Original supplied bottle PNG and WebP files |
| `assets/herby-health/heroes/` | Original `hero 0.png`, `hero 1.png` and hibiscus macro files |
| `assets/herby-health/editorial/` | Original ingredient, carton, tea and kitchen photographs |
| `assets/herby-health/reference/` | Collection overview, original handoff manifest and sprite files |
| `public/images/herby-health/` | Website images, including optimised product and garden exports |
| `scripts/` | Asset preparation, browser checks and production rendering |

## Image placement

| Placement | Supplied image |
| --- | --- |
| Opening hero | `hibiscus-hero` — ruby hibiscus macro |
| Featured pair | `hibiscus` mulberry carton and `hibiscus-in-use` tea, touching 4:5 portraits |
| Product grid | Branded Collagen, Moringa, Sea Moss, Bay Leaves, Cinnamon, Chia Seeds and Ashwagandha bottles, in that order |
| Story | `hero 1.png` — hands harvesting moringa |
| Closing garden hero | `hero 0.png` — aerial garden |
| Product galleries | Branded bottle plus the corresponding editorial ingredient photograph; Hibiscus also has its tea photograph |

Homepage cards and the featured pair open ingredient details. Enquiry actions select that ingredient and retain the visitor's draft. Full ingredient pages remain available from each detail view.

To recreate the responsive bottle and garden exports from the supplied originals:

```sh
python scripts/prepare-assets.py
```

This script requires Pillow. It only organises and resizes existing images and updates the runtime manifest; it never synthesises image content. Originals retain their filenames and are not overwritten.

Contact and checkout save enquiries, private attachments and orders. Paystack hosted payments and Resend transactional emails are implemented; account keys, a verified sending domain and public webhooks are required for live activation. See [Payments and email setup](docs/payments-email-setup.md). WhatsApp is not connected.

Collection, Rituals, Our Story, Contact and FAQs have dedicated pages at `/collection`, `/rituals`, `/our-story`, `/contact` and `/faqs`. Production builds prerender these pages for direct access.

The help centre at `/get-help` has nine topic groups, 23 searchable articles, grid/list layouts and links to contact support and FAQs. Topic and article URLs support reload and browser history. Edit content in `src/data/help.mjs`; article counts update automatically. Run `node scripts/qa-help.mjs` against the production preview (or set `QA_URL`) to verify responsive layouts, search, article links, history, keyboard focus and accessibility. Regenerate its responsive garden banners with `python scripts/prepare-help-images.py`.

**Say hello** opens the contact form. Set public email, phone and address in Dashboard → Settings. Blank contact fields are omitted from the public site. The footer's Socials column includes Instagram, Facebook, X and Google Business Profile; add their verified HTTPS profile URLs in Dashboard → Settings → Social profiles. Empty profiles appear as plain text until linked. Use a public Google Maps or Business Profile share link. Saved links open in a new tab.

Run `node scripts/qa-pages.mjs` for page navigation, responsive layout, enquiry and footer cursor checks. Set `QA_URL=http://localhost:4173` to check the production preview.

## Collection catalogue

`/collection` includes category filters, ingredient search, featured, alphabetical and price sorting, shareable filter URLs, and a reset action. The database starts with the existing eight ingredients and proposed retail offers. Owners edit prices, descriptions, pack sizes, formats, visibility and stock in the dashboard. Confirm supplier labels and proposed offers before public sales.

Every ingredient has a quick guide and a full product page covering benefits and evidence, preparation, suitability, storage, and enquiry/delivery information. Educational content and source links live in `src/data/product-guides.mjs`. Supplier-confirmed ingredients, allergens, formats, serving directions and pack sizes must replace the corresponding enquiry guidance before a retail launch. Product pictures are concept packaging.

After `npm run build`, run `npm run preview -- --port 4173` and `node scripts/qa-collection.mjs`. This checks 375/768/1280px layouts, filters, sorting, URL reload/back navigation, modal focus/Escape, enquiry preselection, eight product guides and axe accessibility. On Windows it uses the installed Edge browser; set `QA_BROWSER=chrome` for Chrome. Screenshots are written to ignored `artifacts/collection/`. Run `node scripts/audit-collection.mjs` for three mobile and desktop Lighthouse runs against the production preview.


## Payments, invoices and transactional email

Follow [the setup guide](docs/payments-email-setup.md) for Paystack and Resend environment variables, webhook URLs, test/live activation and email reliability. Dashboard ? Notifications contains provider readiness, delivery logs, retries and branded template previews; Dashboard ? Enquiries supports saved email replies. Run `npm run emails:preview` for the local email gallery and `npm run qa:payments` for the isolated fake-provider browser journey.
