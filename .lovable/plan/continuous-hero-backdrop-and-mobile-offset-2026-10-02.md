# Continuous hero backdrop and mobile offset

## What will change
- Lift the active hero artwork into the home page wrapper as a decorative ambient layer behind the hero and opening content rows.
- Fade that ambient layer gradually into the page background so no clipped edge or dark band appears below the hero.
- Define one shared navbar-offset variable in the Hero and use it for both the mobile poster start and content placement.
- Preserve the existing navbar, hero styling, controls, carousel behavior, and desktop layout.

## Technical details
- `HeroBanner` will expose the active artwork URL through an optional callback while retaining its foreground artwork and effects.
- The home page wrapper will render the reported artwork as an absolute, non-interactive, overflow-clipped backdrop with a long semantic-background fade.
- The Hero loading and loaded states will share the same mobile height and offset calculations.
- Only `src/components/HeroBanner.tsx` and `src/pages/Index.tsx` will change.

## Verification
- Check desktop and mobile screenshots for a continuous transition into Trending Now.
- Confirm mobile badges, artwork, title, and buttons clear the floating navbar.
- Confirm the preview build has no errors.
