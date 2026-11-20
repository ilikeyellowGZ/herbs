# Local assets and collection alignment

Goal: apply the supplied DESIGN herbs.md using only images already in this project.

Design authority: DESIGN herbs.md; the user's request approves its implementation.

- [x] Group root source images into assets/herby-health/products, editorial and heroes; preserve every original file. Keep served images in public/images/herby-health.
- [x] Create responsive exports of the supplied bottle photographs and hero 0/hero 1; centralise their paths in src/data/images.json. Retain the existing carton/tea feature and hibiscus macro hero.
- [x] Use branded bottles in product cards, the supplied harvest photograph beside the story, and the supplied aerial garden image for the closing hero. Keep the editorial ingredient images available in product galleries.
- [x] Make the featured pair and home collection cards open the ingredient modal; retain complete product pages and the existing enquiry draft.
- [x] Align gutters, header overlay, feature sizes, and type with the brief. Preserve the existing scroll expansion.
- [x] Run build, catalogue/enquiry tests, and browser checks for every ingredient, mobile/desktop geometry, keyboard focus, images and enquiry selection. Document the asset paths and commands in README.md.

Verification: production build and both catalogue/enquiry tests passed. Browser QA passed all eight ingredients, nine requested widths, two-column/four-column switch, paired feature, modal keyboard focus, menu, FAQ, enquiry draft retention, reduced motion and prerendered routes. No browser errors or failed image requests. All 21 runtime image manifest entries resolve. Additional checks at 375px and 1280px passed; final phone card alignment and 1600px hero source were verified.
