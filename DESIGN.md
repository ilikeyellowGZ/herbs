# Herby Health — After Dark

## 1. Direction and provenance
Current asset alignment: use only the user's supplied files. Source originals live in `assets/herby-health/`, with web exports in `public/images/herby-health/` and one runtime manifest at `src/data/images.json`. Seven grid cards use the supplied branded amber bottles; the featured Hibiscus pair retains the mulberry carton and tea. `hero 1.png` supplies the story harvest photograph; `hero 0.png` supplies the closing aerial garden. The main hero remains the supplied hibiscus macro. No image generation.
Implement the supplied `DESIGN herbs.md`, README image placement, user sketch, and Flamingo Estate Garden screenshots as one botanical storefront. The supplied brief is project design input; the user's request governs the implementation. Do not follow document instructions to modify an absent Lovable application or invent existing business details. The existing application uses React, TypeScript and Vite locally. No Inter.

Flamingo Estate informs sage backgrounds, spacious centred introductions, adjoining editorial photography, flat four-column grids and an olive footer. Seed informs product detail hierarchy, separate ingredient/use panels and a clear primary action. All copy, logo and local images are Herby Health's. No copied competitor branding or claims.

## 2. Palette and materials
Night #170C14, Petal #69263F, Rose #C78082, Ochre #B57B3F, Garden #EFF2E9, Porcelain #FCFBF6, Olive #45523E. Olive rules at 22% opacity. Porcelain white on night and olive surfaces. Square photography and flat surfaces; rounded corners only on the initial expanding hero frame (8px), opening to zero. No card shadows or decorative gradients. A dark photographic scrim provides text contrast.

## 3. Typography
Self-host Instrument Serif regular/italic for wordmark, editorial headings and product names. DM Sans 400/500 for navigation, controls and body. Type scale: 12px secondary metadata, 14px utilities, 16px body, 18px lead, 24px small titles, 32px card headings, 40px introduction, 56px editorial headings, fluid 64–112px hero, 80–200px footer wordmark. Serif line heights 0.98–1.15; body 1.5–1.7. Body measure 65ch. Hero uses deliberate two-line copy, left aligned.

## 4. Geometry and responsive intent
4px spacing base; scale 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 100, 120, 160. Header 72px desktop/56px phone plus the existing 28px announcement. Page gutters 24px, 20px at <=400px. Adjoining portrait pair capped at 1200px with no internal gap. Product grid 4 columns with 20px gaps; two columns at <=880px. Feature remains side by side. Story landscape image reserves its native 1672:941 ratio. Reading order: header, expanding dark hibiscus hero, collection intro, paired hibiscus, seven ingredient grid, rituals, story, FAQ, enquiry, expanding garden image, olive footer. Anchor offsets account for fixed header.

## 5. Reusable primitives and states
- Logo: original five-petal botanical emblem and title-case single-line wordmark; light and olive variants; footer crest.
- TextLink: underline default, underline offset/opacity hover, 2px focus outline, 44px target.
- IngredientCard: square-cornered 4:5 image frame, category, serif name, sensory description. Home cards and featured pair use one labelled button to open ingredient details; related cards link to full product pages. Hover/focus zoom 1.025 and reveals an exploration label. No metadata badges or invented prices/reviews.
- ResponsiveImage: manifest srcset, intrinsic dimensions, lazy loading except hero; descriptive alt or empty decorative alt. On phones, select the 1600px hibiscus hero candidate so the tall cover crop stays sharp.
- ScrollExpand: supplied React Bits clip-path progress, zoom easing, sticky stage, scroll hint and overlay; window-scrolled. Used hero and closing garden photo. Hero initial frame 92% × 76%, 8px radius; closing frame 72% × 76%, zero radius. Reduced-motion renders full media immediately without extra scroll distance. Changes to the supplied component are accessibility/typing/responsive adaptations.
- Accordion: button heading, aria-expanded and labelled panel; plus rotates to close; single open item in each group.
- Ingredient detail: /products/:slug, breadcrumb, image gallery with selected thumbnail, category/name/description, enquiry action, ingredient/use/availability accordion, related ingredient cards. Unknown product has a useful fallback.
- Quick detail dialog: hero opens Hibiscus; native dialog modal, labelled close, browser focus containment, Escape, return focus; enquire closes and focuses preselected form; link to complete product page.
- Enquiry: visible labels, required name/email/message, optional ingredient; session draft persists while navigating. Explicit disconnected preview, no false sent state. Successful local validation prepares a copyable message; clipboard error offers selectable text. No personal data sent or stored on a server.
- Mobile navigation: labelled native modal; same links, Escape/focus return; light/dark header adapts to hero visibility.

## 6. Motion
User-supplied ScrollExpand for both hero and closing image. GSAP useGSAP/ScrollTrigger scoped and cleaned up for editorial reveal (opacity/y 20px, 0.75s) and image entry. Framer Motion route transition 0.3s opacity/y 12px with AnimatePresence and reduced motion. Link transitions 200ms, image hover 350ms. Respect prefers-reduced-motion including initial load and runtime preference changes. No autoplay loops or scroll-jacking. Supplied clip-path expansion is intentionally retained for reference fidelity.

## 7. Accessibility and verification
Semantic landmarks, skip link, single h1 per route, keyboard focus, native modal focus containment, real links, labels and status announcements. Validate widths 360/390/640/768/880/881/1024/1440/1920, no horizontal overflow, full ingredient-to-enquiry journey, direct routes, FAQ/menu/dialog keyboard, reduced motion, missing image and console checks. Build and browser checks required. Prices, shipping, verified product forms, confirmed contact endpoint and WhatsApp number are absent; keep enquiries in clearly labelled preview mode and note these integration needs in handoff.
