# Herby Health — After Dark

React, TypeScript and Vite storefront following [DESIGN herbs.md](<DESIGN herbs.md>).
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

The enquiry form is in preview mode until a real contact endpoint is configured. Prices, ordering and WhatsApp are not connected.

Collection, Rituals, Our Story, Contact and FAQs have dedicated pages at `/collection`, `/rituals`, `/our-story`, `/contact` and `/faqs`. Production builds prerender these pages for direct access.

To connect every **Say hello** action to the company Instagram, copy `.env.example` to `.env.local` and set `VITE_INSTAGRAM_URL` to the confirmed full profile URL. Restart the development server or rebuild production after changing it. Until configured, these links open Contact. The profile handle has not yet been supplied.

Run `node scripts/qa-pages.mjs` for page navigation, responsive layout, enquiry and footer cursor checks. Set `QA_URL=http://localhost:4173` to check the production preview.
