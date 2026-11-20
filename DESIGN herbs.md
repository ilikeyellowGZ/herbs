# Herby Health — After Dark

## Codex implementation brief

Apply this design to the existing Herby Health Lovable project. Inspect the current React, TypeScript and Tailwind components, ingredient data, asset imports and enquiry flow first. Reuse them where possible. Implement the homepage, responsive states and ingredient-to-enquiry journey described below. Keep working hash links such as `#home`, `#collection`, `#story`, `#faqs` and `#contact` usable. Match the final homepage mockup with the **mulberry carton**.

Herby Health is a botanical and everyday wellness brand based in Gauteng, South Africa. Open with a ruby hibiscus petal in deep shadow. On scroll, step into daylight: a pale sage collection with two adjoining photographs of one product. Let the first photograph show what the product looks like and the second show how it fits into someone's day. Use short, sensory South African English. Keep “After Dark” as the design name.

## Page structure and wireframes

| Section | Desktop · 1440 × 900 | Phone · 390 × 844 |
| --- | --- | --- |
| Header | Herby Health on the left. Collection, Rituals, Our story and Say hello on the right. Overlay the hero. | Wordmark and Menu. Open a labelled menu with the same destinations. |
| Hero | Full-width hibiscus macro. Position **The hibiscus moment.** and two underlined actions at the lower left. | Keep the petal texture and dark copy area in frame. Let the headline wrap and stack the actions when needed. |
| Collection introduction | Centre **THE COLLECTION** over **Eight ingredients for everyday rituals.** | Keep the same wording and centre alignment, with less vertical space. |
| Featured Hibiscus | Two adjoining 4:5 photographs, packshot left and prepared tea right. One shared caption, **Botanical tea / Hibiscus**. | Both photographs stay side by side and share the caption. The entire pair opens one detail view. |
| Ingredient grid | First row: Collagen, Moringa, Sea Moss, Bay Leaves. Second row: Cinnamon, Chia Seeds, Ashwagandha. | Two columns in the same reading order. Ashwagandha occupies the final left cell. |
| Rituals and story | Pair the garden photograph with the story. Link everyday rituals to their relevant ingredients. | Stack the photo and text. Keep separate destinations for Rituals and Our story. |
| FAQs, enquiry, footer | Accessible FAQ accordion; Say hello enquiry form; wordmark, navigation and Gauteng, South Africa in the footer. | Single-column flow, visible field labels and comfortable tap targets. |

Hibiscus already occupies the feature. The grid contains the other seven ingredients. Preserve existing ingredient descriptions, FAQ answers and relevant site content when applying this visual hierarchy. Collagen’s category is **Wellness supplement**.

## Brand tokens

| Token | Value | Use |
| --- | --- | --- |
| Night | `#170C14` | Hero background and darkest photographic shadows |
| Petal | `#69263F` | Mulberry packaging and selected brand accents |
| Rose | `#C78082` | Ceramic and photographic accents |
| Ochre | `#B57B3F` | Sunlit plaster, stone and packaging details |
| Garden | `#EFF2E9` | Collection background |
| Porcelain | `#FCFBF6` | Hero lettering, light header and page surfaces |
| Olive | `#45523E` | Text, icons and rules on light backgrounds |

Use a title-case, single-line **Herby Health** wordmark with clear space approximately equal to its capital H. Use 1.5px line icons for the menu, close and arrows. Give photographs square corners and independent product tiles a flat surface. Divide functional sections with a 1px olive rule at 22% opacity. Use solid olive for text that needs higher contrast.

| Type role | Family | Size and treatment |
| --- | --- | --- |
| Wordmark, hero and editorial headings | Instrument Serif Regular, Georgia, serif | Hero 52–108px, line height 0.98. Section titles 32–52px, line height 1.1. |
| Navigation, body and form controls | DM Sans Regular or Medium, system-ui, sans-serif | Body 16–18px, line height 1.5. Keep long story text near 65 characters per line. |
| Category and utility labels | DM Sans Medium | 12–13px, 0.06em tracking. Use uppercase sparingly. |

## Layout and breakpoints

- **Outer layout:** full viewport width. Use 24px page gutters and reduce them to 20px at 400px and below. Keep the hero edge to edge. Cap only the paired product spread at 1200px.
- **Desktop above 880px:** 72px header. Set the hero height to approximately `clamp(560px, 80svh, 900px)`. Use four equal product columns with 20px gaps. Allow about 80px after the grid. Give the collection intro 100px top and 80px bottom padding; centre its copy within 540px.
- **Tablet at 880px and below:** switch the product grid to two columns. Give the collection intro 80px top and 60px bottom padding, with a 370px text measure. Leave about 40px after product rows.
- **Phone at 640px and below:** use a 56px header and 40px vertical intro padding. Let hero height respond to content and available screen height. Keep all hero actions reachable on short screens.
- **Header transition:** while the hero is behind the header, use porcelain lettering over the photograph. Beyond the hero, switch to a porcelain surface, olive lettering and a 1px bottom rule. Offset anchor targets by the sticky header height.

## Assets and crops

Match assets by their content. Resolve the actual files in the project before creating imports. The source links below are handoff references for the project owner. Serve the website imagery from project assets or its configured media host.

| Placement | Asset and crop |
| --- | --- |
| Hero | [Velvet Hibiscus in Deep Vermilion](https://chatgpt.com/library?file_id=libfile_3009f7f329a481919f4b446a3c15fd95&account_id=personal). Preserve the brighter petal edge on the right and negative space behind the live heading on the left. Review the phone crop separately. |
| Feature, left | [Herby Health Hibiscus Drawer Box](https://chatgpt.com/library?file_id=libfile_b2b7eba615ec8191af3fe6fbf31c4a2d&account_id=personal). Keep all four carton corners, pull tab and soft shadow visible against off-white. |
| Feature, right | [Quiet hibiscus tea in warm light](https://chatgpt.com/library?file_id=libfile_0fe5c9159dfc819196ffb55270b28c63&account_id=personal). Show the rose cup, mulberry carton and dried hibiscus against ochre plaster. |
| Rituals or story | [Wicker Basket, Bay, and Moringa](https://chatgpt.com/library?file_id=libfile_054b674f4fe48191bd68cb369ce8d9ee&account_id=personal). Keep the basket and kitchen context in the wide shot. |
| Layout reference | [After Dark guide and wireframes](https://chatgpt.com/library?file_id=libfile_942cdf0482188191bffc0ebfc7a4dac1&account_id=personal). See pages 6–7 for desktop, mobile and the open ingredient detail. Build headings, controls and links as live elements. |

Use the existing seven ingredient photographs where they match the content. If an asset is missing, use a suitable existing local fallback and identify it in the implementation summary. Treat the carton artwork as concept packaging. Confirm the packaging and contents before presenting them as a retail offer.

Export responsive WebP or AVIF with a JPEG fallback where available. For the paired portraits, use 320, 480, 640, 800 and 1080px candidates up to native resolution. Set intrinsic dimensions or an aspect ratio to reserve space. Prioritise the hero image and lazy-load images below the fold. For each half of the paired spread, the following `sizes` value matches the specified gutters:

```html
sizes="(min-width: 1248px) 600px, (max-width: 400px) calc(50vw - 20px), calc(50vw - 24px)"
```

## Interactions and copy

| Control | Behaviour |
| --- | --- |
| **Explore hibiscus** | Opens Hibiscus details. Implement as a button styled like a text link. |
| **The collection** | Links to the collection heading. Maintain a visible 1px underline with a 4px offset. |
| **Feature or product card** | One focusable control per ingredient. Open the detail drawer with the image, category, name, existing description, everyday use and **Enquire about [ingredient]**. |
| **Enquire about [ingredient]** | Close the drawer, move to the enquiry form, preselect that ingredient and put focus in the form. Preserve any text already entered. |
| **Menu and drawer** | Provide accessible names and visible close controls. Trap focus in modal states, support Escape and restore focus to the trigger on ordinary dismissal. |
| **FAQ** | Use heading buttons with expanded state and an associated answer panel. Support both keyboard and touch. |
| **Say hello** | Keep name, email, optional ingredient and message fields. Show preview wording while the form is disconnected. When connected, report the actual outcome and retain input on failure. Enable WhatsApp when the business number is confirmed. |

Use the approved business details and existing factual copy. Keep availability, prices, delivery coverage, supplement suitability and sourcing tied to confirmed information.

## Motion and accessibility

| Element | Behaviour |
| --- | --- |
| Text links | 200ms ease-in-out underline transition on hover-capable devices. Keep keyboard focus visibly distinct. |
| Product photography | Optional scale to 1.025 over 350ms ease-out on hover or focus within the tile. Clip inside the image frame. |
| Ingredient drawer | 240ms slide with a 180ms backdrop fade. Give immediate feedback on tap. |
| Reduced motion | Honour `prefers-reduced-motion`: remove image zoom, smooth scrolling and drawer travel. Preserve open, closed, active and focus states. |

Give interactive controls a 44px touch target. Use a 2px high-contrast focus outline with a 3px offset. Check the hero heading and links against the brightest part of each responsive crop. Give meaningful product photos concise alt text and the linked pair one accessible name. A purely decorative hero image can have empty alt text.

## Definition of done

- At **1440 × 900**, the dark hero leads to a pale sage collection, one touching photo pair and a four-column ingredient grid. At **390 × 844**, the pair remains intact and the grid has two columns.
- Check **360, 390, 640, 768, 880, 881, 1024, 1440 and 1920px** widths. Confirm that the 880/881px switch works, long ingredient names fit and the page has no horizontal overflow.
- Reach all eight ingredients. Verify both hero actions, navigation anchors, FAQ controls, mobile menu and ingredient-to-enquiry preselection.
- Test keyboard opening and closing, Escape, focus return, reduced motion and header contrast on both hero and collection surfaces.
- Run the existing project build and relevant checks. Report the files changed and any outstanding asset or contact configuration.

## Reference provenance

Flamingo Estate’s Garden collection informed the pale sage surface, centred introduction, two photographs for one product, square image edges and responsive grid. Its published theme uses Exposure and Maison Neue. Herby Health uses Instrument Serif and DM Sans. The dark petal hero is specific to Herby Health. The supplied T2 packshot and lifestyle frames informed the 4:5 framing, lighting and packaging presentation. Their responsive image widths describe image resources; use the layout breakpoints specified above.

[Flamingo Estate Garden collection](https://flamingoestate.com/collections/farm-garden) · [Iakoe storefront case study](https://iakoe.com/case-studies/flamingo-estate-ux-and-theme-development) · [Micah Woods art direction and packaging](https://www.micahtoddwoods.co/case-studies/flamingo-estate)
