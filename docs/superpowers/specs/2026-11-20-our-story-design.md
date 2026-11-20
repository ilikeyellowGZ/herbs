# Herby Health — Our Story

Status: proposed design for review. The page has not been implemented.

## Purpose

Create a dedicated `/our-story` page that introduces Herby Health through its philosophy, people, connection to nature and collection. Keep the established sage, olive and mulberry palette, Instrument Serif headings, DM Sans body text and generous photographic layouts from `DESIGN.md`.

## Approaches considered

1. **Editorial brand story — recommended.** Large landscape opening, a substantial About Us section, a portrait with a people section, garden photography and a product still life. Gives the business a distinct story while connecting visitors to the collection.
2. **Compact About Us.** Short introduction with three images and a collection link. Quicker to read, with less space for the company narrative.
3. **Founder interview.** Portraits, personal quotations and a chronological history. Best developed once the owner supplies their name, biography and actual milestones.

## Recommended page and draft copy

### Opening

Eyebrow: Our story · Gauteng, South Africa

Heading: A little closer to nature. A little closer to ourselves.

Introduction: Life is made of small things. A kettle coming to the boil. A familiar fragrance in the kitchen. A moment that belongs to you. At Herby Health, we make room for those things.

Image: wide botanical landscape with warm natural light, using the supplied garden photograph or a clearly identified generated editorial landscape.

### About us — Good things. Deep roots.

We’re Herby Health, a botanical and everyday wellness brand based in Gauteng, South Africa. Our collection brings together ingredients for the kitchen, the cup and the little rituals that give a day its own rhythm.

We believe that getting closer to nature can begin with something simple: knowing an ingredient, noticing its character, finding a way to make it part of your day. The tart brightness of hibiscus. The familiar warmth of cinnamon. A handful of leaves, and something good on the stove.

That is the spirit behind Herby Health. A thoughtful collection, an open conversation and an invitation to take your time. To be curious about what you bring into your home. To find pleasure in the ordinary. To make a small ritual your own.

### The people behind the collection — Care begins with people.

Behind every brand is a person who cares about what it puts into the world. For Herby Health, that care means making space for questions, sharing the character of each ingredient and helping you explore the collection at your own pace.

We want the conversation to feel personal. Tell us what caught your eye, what you enjoy making or which ingredient you would like to understand a little better. Good things often begin with a hello.

Portrait: no identified owner portrait is present in the repository. A generated person can be used as an editorial illustration with a visible caption, “Illustrative portrait · AI-generated”. Do not identify the generated person as the actual owner or attribute quotations to them. A supplied owner reference can replace the illustrative portrait.

### A connection to the land — Where our inspiration grows.

A garden asks you to notice things. The shape of a leaf. A change in the light. The patience of something growing. It is a way of looking at the world that we bring to Herby Health.

Our visual world takes its cues from that closeness: green leaves, honest textures, sun-warmed earth and ingredients with a character of their own. A reminder that there is still something worth slowing down for.

Images: the supplied aerial garden and harvest photographs, supplemented by generated botanical details if useful. Describe these as imagery and inspiration; do not assert that a depicted property is company-owned or that every product is grown there.

### From our collection to your day — A cup. A leaf. A little possibility.

Our collection moves between the pantry and the everyday ritual: hibiscus for a bright infusion, cinnamon for warmth, bay leaves for a pot left to simmer. Alongside these kitchen companions, you’ll find botanicals and wellness ingredients to explore through their individual product information.

Start with what interests you. Get to know its character. Ask us about the available format and make your next small ritual a considered one.

Images: existing branded bottles and a generated editorial still life that preserves the established amber-glass and mulberry packaging direction. Any generated packaging remains concept imagery.

Links: Discover hibiscus; Explore the collection.

### Closing — Your next little ritual starts here.

Whether you’re here for a familiar favourite or something you’ve never tried before, we’re glad you found us.

Links: Explore the collection; Say hello.

## Content boundaries

The existing brief establishes the name, Gauteng location and collection. Owner identity, founding dates, historical events, land ownership, farming practices, certification and sourcing arrangements are absent. The narrative above develops the brand philosophy without inventing those facts. The user's current request permits generated assets, superseding the older project note against image generation for this page.

## Integration

- Add `src/pages/OurStory.tsx` and lazy-load `/our-story` using the existing router and route transition.
- Point desktop navigation, mobile navigation and footer “Our story” links to the dedicated route. Retain the homepage `#story` anchor and give its teaser a link to the full page.
- Reuse `ResponsiveImage`, existing link styles, shared header/footer and collection/enquiry destinations.
- Add page-specific title and description in client navigation and prerender output. Include `/our-story` in the static route build.
- Store optimised new assets locally, record their provenance, and add responsive candidates to the image manifest. Load the opening image eagerly; lazy-load later images with intrinsic dimensions.
- Document any new page layout primitives in `DESIGN.md` before implementation.

## Responsive and accessibility requirements

Use two-column editorial sections on desktop, stacking in reading order below the existing 880px breakpoint. Keep body text at least 16px, captions at least 14px, one page heading, descriptive alt text and visible keyboard focus. Respect reduced-motion preferences. Avoid image text that would be unreadable on phones.

## Verification after implementation

Run the production build and existing tests. Check direct access to `/our-story`, prerendered content, metadata, navigation from all entry points, collection/enquiry links, image loading, reduced motion, and layouts at 375px, 768px and 1280px. Inspect screenshots for cropping, readable captions and overflow. Record verification limits accurately.
