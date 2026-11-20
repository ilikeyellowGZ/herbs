# Get help

The supplied screenshot defines the banner, search, directory grid/list toggle and support area. Use Herby Health's existing garden image, palette, fonts, header and footer. The screenshot's blue text selection is not part of the design.

Build `/get-help` as a lazy route with unique metadata and prerendered HTML. Nine topics cover actual store functionality rather than unsupported subscription or loyalty programmes. Each card opens articles; search matches topic names, article titles and answers. Show actual article counts, a clear action and useful no-results state. URL parameters preserve search/category/article links through reload and browser history. All content stays local; enquiries use the existing Contact page.

Keep components in `src/pages/GetHelp.tsx`, styles in `src/help.css` and searchable content in `src/data/help.mjs`. Add navigation/footer links without disturbing other ongoing work. Follow DESIGN.md's Get help tokens and responsive contract. Verify with Node tests, production build and browser checks at 375, 768 and 1280px, including keyboard focus and accessibility.
