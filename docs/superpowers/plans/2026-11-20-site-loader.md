# Site Loader Implementation Plan

**Goal:** Add the approved botanical loading intro and replace the plain route fallback with the same branded presentation.

**Architecture:** LoadingScreen owns reusable visual markup and CSS; SiteLoader owns initial readiness, bounded timers, scroll locking and temporary inert content. App renders SiteLoader outside the route transition and signals first-route readiness from inside Suspense. Server markup includes the intro; a noscript style preserves direct access without JavaScript.

**Tech Stack:** React 19, TypeScript, existing BotanicalMark, CSS, Vite, Playwright.

**Spec:** docs/superpowers/specs/2026-11-20-site-loader-design.md

## Constraints

Use Garden/Olive and existing fonts. No new dependencies or imagery. Initial overlay only once per document load. Minimum animated entrance 1600ms; readiness safety limit 5000ms; exit 280ms. Reduced motion skips the minimum hold and removes position/scale movement. Preserve prerendered content and existing in-progress changes.

## Tasks

- [x] Record loader primitive, responsive sizes, motion and accessibility in DESIGN.md.
- [x] Add scripts/qa-loader.mjs, exercising the actual browser lifecycle; verify the initial-loader expectation fails against the existing site.
- [x] Create src/components/SiteLoader.tsx and src/loader.css. Export LoadingScreen for the route fallback and RouteReady for the initial-route callback. Keep timer and listener cleanup local to SiteLoader.
- [x] Integrate in src/App.tsx with a stable first-route callback and a site-content shell. Include a noscript loader override in index.html.
- [x] Build, run existing tests, execute loader browser checks at 375/768/1280, inspect screenshots, and fix any failures. Check slow readiness, internal navigation, direct destinations, reduced motion and no-JavaScript access.

## Verification

Production build passed. All 18 existing storefront unit tests passed. Loader browser QA passed at 375/768/1280px, including pending eager imagery, dismissal, keyboard access, no replay during internal navigation, reduced-motion direct routes, live preference changes, five-second stalled-image escape, no-JavaScript content and no runtime/hydration errors. The direct-route accessibility scan had zero violations. Screenshots are in artifacts/loader. React Doctor reported no diagnostics for the loader files; its unrelated existing warnings remain.

The unrelated backend files were added by concurrent work during verification. A final npm test run passed all 26 tests, including that backend suite. No backend files were changed for this loader.
