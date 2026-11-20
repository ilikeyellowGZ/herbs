# Botanical logo animation

Approved by the user on 20 November 2026: animate the existing logo in the navbar and footer with a stem-to-flower reveal and gentle hover/focus sway.

Preserve the original SVG paths, inherited colour, dimensions and wordmark. GSAP grows the stems, unfurls the leaves and opens the flower using transforms and opacity over approximately 1.6 seconds. Reveal each animated emblem once when it enters the viewport. Framer Motion supplies a brief, settling sway on hover or keyboard focus of its home link. Separate SVG groups give each engine its own transform target.

The navbar remains a home link. Make the footer crest a labelled home link to provide the same keyboard interaction. Other botanical marks, including the footer cursor, remain static. Respect reduced motion on initial load and runtime changes; show the complete logo without animation. Server output and no-JavaScript output retain the complete mark. Revert timelines, media listeners and intersection observers on unmount.

Verify the production build and existing tests, then exercise viewport entry, hover, focus, navigation, reduced motion and responsive layout at 375, 768 and 1280px in a real browser.

## Footer wind refinement

User-requested update: the footer flower sways on viewport entry, pointer entry anywhere in the footer, direct crest hover and footer keyboard focus, with another breeze every 10 seconds while visible. Interpret “sing” as “swing” given the wind description; no audio. Bend the full plant up to 4 degrees around the stem base and the flower head up to 7 degrees around its neck, with an offset response that settles over 3.4s. Add separate nested GSAP targets so reveal and hover transforms cannot conflict. Avoid restarting an active breeze. Suspend and reset when the footer leaves the viewport or the tab is hidden; clean up intervals, events and observers. Reduced motion disables every breeze, including after a live preference change. The navbar behavior stays as approved.
