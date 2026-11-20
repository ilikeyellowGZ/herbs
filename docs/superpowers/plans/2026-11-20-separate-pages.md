# Separate pages and footer cursor

**Goal:** Give Collection, Rituals, Our Story, Contact and FAQs dedicated URLs, make Say hello open the confirmed company Instagram, and add a smooth botanical footer cursor.

**Architecture:** Keep the existing React Router layout, brand components and supplied imagery. Extract homepage sections into lazy route modules. Share route metadata between navigation effects and static prerendering. Preserve product enquiry drafts across navigation.

**Design:** Preserve the current garden hero and closing photograph. Replace full homepage sections with a concise destination index. Use the existing sage/olive palette and serif headings on dedicated pages. The footer pointer uses the existing botanical SVG inside a 64px porcelain circle, with a 200ms trailing response. Enable only for a fine, hovering pointer and disable for reduced motion; hide on exit, scroll, blur and keyboard use.

**Constraints:** Preserve existing workspace edits. No new dependencies or imagery. Instagram URL requires the owner's confirmation; do not invent a handle. Keep the disconnected enquiry form honest.

## Tasks

- [ ] Extract Collection, Rituals, Story and FAQs; wrap Contact with a route-level heading. Replace homepage sections with links.
- [ ] Update shared navigation, product links, enquiry navigation, page metadata and prerender paths.
- [ ] Add the circular logo cursor with cleanup and pointer/reduced-motion gates.
- [ ] Link all Say hello actions to the confirmed Instagram profile.
- [ ] Run production build, existing tests and browser checks for direct routes, navigation, selected enquiries, mobile layout, FAQ and cursor behavior.
