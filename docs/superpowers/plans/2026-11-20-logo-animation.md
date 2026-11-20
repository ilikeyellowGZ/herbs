# Botanical Logo Animation Implementation Plan

**Goal:** Animate the approved navbar and footer emblems while preserving the existing design.

**Architecture:** Keep BotanicalMark static by default. Opt in through a shared animated home-link component. GSAP controls inner SVG groups; Framer Motion controls their outer sway group. Run inline in the current workspace, preserving unrelated edits.

**Tech Stack:** React, TypeScript, GSAP/useGSAP, Framer Motion, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-20-logo-animation-design.md`

## Constraints

Original SVG artwork, currentColor, existing dimensions, no new dependencies. Animate only navbar and footer crest. Reduced-motion changes must cancel animation and restore the full mark. The user's footer refinement explicitly permits a wind animation every ten seconds while the footer is visible, plus footer/crest hover and focus triggers. Pause and reset when offscreen or the tab is hidden.

## Task 1: Implement and verify the animated logo

- [x] Update DESIGN.md with the approved motion and footer-link state.
- [x] Split the existing SVG into stem, leaf, flower and sprig groups without changing its geometry; add opt-in animation in src/components/Logo.tsx.
- [x] Use a scoped useGSAP timeline plus matchMedia and an IntersectionObserver for one reveal per mount; clean up all resources.
- [x] Export a shared BotanicalLogoLink with Framer Motion hover/focus variants and reactive reduced-motion support; use it in Logo and Footer.
- [x] Add only footer-link sizing/focus styles required to retain the existing layout.
- [x] Run npm test and npm run build.
- [x] Exercise reveal, resting state, hover, keyboard focus, home navigation, runtime reduced motion and overflow at 375/768/1280px with Playwright; save screenshots under artifacts/logo.
- [x] Review the diff for unrelated changes and report the verified outcome.
