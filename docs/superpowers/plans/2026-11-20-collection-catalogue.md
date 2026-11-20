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

- [ ] Add failing tests in `tests/catalogue-query.test.mjs` for search/category composition, stable immutable sorting, unknown/null/zero prices, and guide coverage.
- [ ] Add `src/data/product-guides.mjs`, enrich `src/data/catalogue.mjs`, and create `src/data/catalogue-query.mjs`; run `npm test`.
- [ ] Add shared `ProductGuide.tsx` and `ProductPrice.tsx`; update `QuickView.tsx` and `pages/Product.tsx` to display the same guide and enquiry details.
- [ ] Build collection-specific cards and controls in `pages/Collection.tsx`, using URL-backed state, accessible labels, result announcements and empty/reset states. Document primitives in DESIGN.md before use and add scoped styles in `src/collection.css`.
- [ ] Run `npm run build` and `npm test`; add and run browser coverage in `scripts/qa-collection.mjs` against the production preview, inspect screenshots at mobile/tablet/desktop, exercise filters/sort/modal/enquiry and run axe. Run React Doctor and collection Lighthouse audits where supported.
- [ ] Update README with catalogue behaviour and remaining real product information requirements. Report verified results and limitations.
