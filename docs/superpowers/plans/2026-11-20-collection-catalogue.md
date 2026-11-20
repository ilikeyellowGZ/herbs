# Collection Catalogue Implementation Plan

**Goal:** Turn the collection into a useful browsable catalogue with honest pricing and complete ingredient guides.

**Architecture:** Extend the existing catalogue with separate guide metadata, use pure catalogue query helpers, and share presentation between quick views and full product pages. React Router search parameters own the collection control state.

**Tech Stack:** Existing React 19, TypeScript, Vite, React Router, Lucide, Node test runner and Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-20-collection-design.md`

**Execution:** Inline in this session using executing-plans. User approval already covers implementation.

## Constraints

- Keep all existing user edits and supplied imagery.
- Use price on enquiry; confirmed prices, currency, pack sizes and supplement doses are absent.
- Evidence-linked educational content, no invented medical or retail claims.
- Follow DESIGN.md and reuse its tokens and accessible modal/accordion patterns.

## Tasks

- [x] Add failing tests in `tests/catalogue-query.test.mjs` for search/category composition, stable immutable sorting, unknown/null/zero prices, and guide coverage.
- [x] Add `src/data/product-guides.mjs`, enrich `src/data/catalogue.mjs`, and create `src/data/catalogue-query.mjs`; run `npm test`.
- [x] Add shared `ProductGuide.tsx` and `ProductPrice.tsx`; update `QuickView.tsx` and `pages/Product.tsx` to display the same guide and enquiry details.
- [x] Build collection-specific cards and controls in `components/CatalogueBrowser.tsx`, rendered by `pages/Collection.tsx`, using URL-backed state, accessible labels, result announcements and empty/reset states. Preserve the separately maintained homepage `ProductCollection`. Document primitives in DESIGN.md before use and add scoped styles in `src/collection.css`.
- [x] Run `npm run build` and `npm test`; add and run browser coverage in `scripts/qa-collection.mjs` against the production preview, inspect screenshots at mobile/tablet/desktop, exercise filters/sort/modal/enquiry and run axe. Run React Doctor and collection Lighthouse audits where supported.
- [x] Update README with catalogue behaviour and remaining real product information requirements. Report verified results and limitations.

## Verification — 20 November 2026

Production build passed and prerendered all 14 routes. Six Node tests passed. Production browser checks passed at 375/768/1280px: search/category composition, featured/name sorting, disabled unavailable price sorting, reset, URL reload/back navigation, all eight product pages, modal Tab/Escape/focus restoration and enquiry preselection. Axe found no violations in the collection or open guide at these widths. Browser errors: none.

Fixed a static-render hydration mismatch when opening filtered URLs and a clipped sticky close control on mobile. Accessible card names now contain their visible text, including for voice control.

Lighthouse against the local production preview in installed stable Edge, median of three runs per profile:

| Profile | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile | 100 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

`react-doctor --verbose --scope changed` reported no issues. The initial whole-project scan flagged existing scroll-animation cleanup and footer motion-import patterns outside this collection change; the scroll animation already cancels its frame in effect cleanup. React Scan Lite captured eight commits across collection/filter/guide interactions with no commit errors. Its installed API does not classify unnecessary renders and production React does not expose detailed profiling hooks, so no unsupported render-efficiency claim is made.

Reproduce with `node scripts/qa-collection.mjs`, `node scripts/audit-collection.mjs`, and `node scripts/scan-collection.mjs` against the production preview. Reports and screenshots live in ignored `artifacts/collection/`. Local scores do not establish deployed network performance. Real prices, currency, sizes, supplier labels, dosing and order fulfilment remain intentionally unconfirmed; enquiry stays in preview mode.
