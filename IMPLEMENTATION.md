# Herby Health — After Dark

Run `npm install` and `npm run dev` to work locally. The development server defaults to port 5173. `npm run build` creates a deployable `dist/` folder, including complete HTML for the homepage and all eight product pages. `npm run preview -- --port 4173` serves that production build.

The implementation uses the supplied design brief, screenshots and local photographs, with Instrument Serif and DM Sans hosted locally. The botanical emblem and wordmark are original SVG/typographic components. The user-supplied React Bits ScrollExpand is adapted in `src/components/ScrollExpand.tsx` for the hero and final garden photograph. GSAP/ScrollTrigger loads as the collection approaches the viewport; Framer Motion handles route transitions. All motion respects reduced-motion preferences.

The featured Hibiscus pair and seven collection cards open keyboard-accessible ingredient dialogs. Each dialog leads to a complete product page or a preselected enquiry form. Product pages include galleries, ingredient/use/availability panels and related ingredients. Search, mobile navigation and FAQs work. Enquiry drafts survive page navigation in memory.

The form is intentionally a clearly labelled preview: it validates and prepares a copyable enquiry without claiming to send it. A confirmed business email or form endpoint, WhatsApp number, prices, delivery arrangements, final product formats and packaging are still needed for a live retail enquiry service. No fabricated prices or reviews are displayed.

## Assets

Original assets are organised under `assets/herby-health/`; served files live in `public/images/herby-health/`. `src/data/images.json` provides responsive image paths, dimensions and descriptions. Existing editorial still lifes are used in ingredient details; the current collection grid uses the consistent supplied amber-bottle photographs. The mulberry carton and tea photographs remain the featured pair. The closing image uses the supplied aerial garden photograph. No missing-image placeholders are used.

`scripts/prepare-assets.py` organises originals and exports the product/garden derivatives. `scripts/prepare_images.py` can regenerate the additional responsive bottle variants without changing the originals. Asset generation requires Pillow. Normal builds use the already prepared assets and need only Node/npm.

## Verification

- `npm run build`: TypeScript, Vite client build, server rendering and static generation for nine routes.
- `npm test`: catalogue resolution/order and enquiry validation/message preparation.
- `python scripts/qa.py`: real Chromium, production build, all eight product pages, home widths 360/390/640/768/880/881/1024/1440/1920, product widths 360/390/768/1280/1920. Checks no overflow, four/two-column switch, intact photo pair, all card dialogs, gallery controls, Escape/focus restoration, modal Tab containment, FAQ states, search, both expanding images, draft preservation, ingredient preselection, reduced motion, static content with JavaScript disabled, page errors and failed image requests.
- `node scripts/audit.mjs 3`: Lighthouse through real Playwright Chromium and its CDP connection, with three runs per mobile/desktop preset for home and Hibiscus. Axe checks the same four route/preset combinations. Reports and screenshots are written under ignored `artifacts/`.
- React Doctor was run. Its remaining observer/RAF cleanup diagnostics were reviewed against the explicit `disconnect()` calls in Header and `cancelAnimationFrame(raf)`/listener removal in ScrollExpand; the diagnostics do not recognise those closure-based cleanup paths. Browser navigation/unmount checks report no errors. No scanner rules were suppressed.

The final functional browser suite passed with no page errors or failed requests. Final Lighthouse medians from three runs per configuration:

| Page | Preset | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- | --- |
| Home | Mobile | 96 | 100 | 100 | 100 |
| Home | Desktop | 100 | 100 | 100 | 100 |
| Hibiscus product | Mobile | 100 | 100 | 100 | 100 |
| Hibiscus product | Desktop | 100 | 100 | 100 | 100 |

Axe reported zero WCAG violations in all four configurations. The homepage mobile performance target of 100 is not yet consistently met. Consult the generated reports rather than treating an individual score as a guarantee. These are local production-preview measurements, not deployed CDN measurements.

Development-only React Grab and React Scan can be disabled with `VITE_REACT_TOOLS=false`; they are excluded from production. The site has no third-party analytics or external font requests.
