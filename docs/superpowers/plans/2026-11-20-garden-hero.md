# Garden hero implementation

Use the user-approved screenshot and `hero 0.png` as the design contract, with the existing Herby Health identity and scroll animation.

1. Update `DESIGN.md` with the reference geometry, opening copy and motion handoff.
2. Update `Home.tsx` with a centred introduction above an editorial variant of `ScrollExpand`, using `images['garden-aerial']` and retaining ingredient / collection actions.
3. Extend `ScrollExpand.tsx` with an opt-in top-anchored editorial image expansion, intrinsic image dimensions, resize handling, static initial geometry, and reduced-motion support. Keep the closing garden's default variant intact.
4. Style the introduction and centred home masthead in `styles.css`; use the existing palette, fonts and gutters. Update the home preload / social image to the garden asset.
5. Adapt existing browser checks to the new accessible heading and hero geometry. Build, run catalogue tests, inspect the hero on phone/tablet/desktop and intermediate scroll positions, check reverse scroll, reduced motion and the existing ingredient journey.
