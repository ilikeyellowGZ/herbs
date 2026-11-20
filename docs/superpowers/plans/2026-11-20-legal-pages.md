# Legal pages implementation plan

**Goal:** Add readable terms and privacy destinations reachable from every footer.
**Architecture:** Shared typed LegalPage layout, two content components, existing route registry and prerender pipeline. Scoped CSS reuses the documented site design.
**Tech stack:** React, TypeScript, React Router, Vite.
**Spec:** `docs/superpowers/specs/2026-11-20-legal-pages-design.md`.

1. Document legal layout in DESIGN.md; add `src/components/LegalPage.tsx`, `src/legal.css`, `src/pages/Terms.tsx` and `src/pages/Privacy.tsx`. Each content section supplies its heading, anchor and React content to the shared layout.
2. Register lazy routes in `src/App.tsx` and metadata in `src/data/pages.mjs`; append footer legal navigation without changing existing links or unrelated modifications.
3. Run `npm run build` and `npm test`. Use Playwright against a production preview to inspect both routes at 375/768/1280px, verify navigation/anchors/metadata and run axe. Inspect screenshots and report material limitations.

Execute inline under the user's existing authorization. Keep the feature focused; do not add dependencies or tests that merely mirror static copy.
