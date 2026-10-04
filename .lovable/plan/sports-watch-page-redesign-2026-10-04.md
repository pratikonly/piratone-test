# Sports watch page redesign

## What will change
- Rebuild the selected-match view to match the supplied reference: a large player on the left and a compact match-information rail on the right.
- Place the match title, live/sport badges, and horizontally scrollable stream choices directly below the player.
- Add the same-sport live matches beneath the player in a compact two-column list so viewers can switch matches without returning.
- Preserve the existing streamed.pk data source, source switching, stream switching, retry behavior, and fullscreen-enabled player.
- Make the layout collapse cleanly on phones: player first, controls and related matches next, with match details below rather than squeezed beside it.

## Technical details
- Limit implementation to `src/pages/Sports.tsx`; no API or navigation changes.
- Derive provider, stream, category, status, and team details from the data already returned by streamed.pk.
- Use existing semantic colors and button patterns, with accessible labels and selected states.
- Verify the selected-match experience at desktop and mobile sizes, then confirm the preview build is healthy.
