# Herby Health Implementation Plan

**Goal:** Build the supplied botanical storefront, all eight ingredient pages, and working ingredient-to-enquiry navigation.

**Architecture:** Vite React/TypeScript, shared visual primitives, typed ingredient catalogue, React Router, reusable supplied ScrollExpand, scoped GSAP reveals and Framer Motion page transitions. Local asset manifest and self-hosted fonts.

**Spec:** `DESIGN.md` and `DESIGN herbs.md`.

## Constraints
Use supplied local photographs. Instrument Serif and DM Sans; no Inter. Sage collection, mulberry hibiscus feature, four/two-column grid. No fabricated prices, availability, health claims, contact details or sent-form states.

## Execution
- [x] Set up Vite, TypeScript, fonts and development-only React tooling; copy assets into public paths without changing originals.
- [x] Write failing catalogue/enquiry tests, implement catalogue and preview message validation, run tests.
- [x] Integrate and adapt the supplied ScrollExpand; implement responsive header, original botanical logo, home collection, story, FAQs and enquiry.
- [x] Build all product pages with gallery, ingredient detail, related collection, quick detail dialog and preserved enquiry draft.
- [x] Run production build and tests; inspect rendered desktop/mobile screens and drive scrolling, page transitions, galleries, menu, FAQ and enquiry; fix observed issues.
- [x] Record verification evidence and setup instructions in `IMPLEMENTATION.md`.
