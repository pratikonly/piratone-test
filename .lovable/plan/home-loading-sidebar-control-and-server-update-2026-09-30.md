# Home loading, sidebar control, and server update

## Changes
- Add a full hero-carousel skeleton matching the final banner layout, with backdrop, title, metadata, description, action, poster, and slide indicators.
- Upgrade movie-row skeletons with richer poster surfaces, badges, varied text widths, and a restrained shimmer while keeping horizontal scrolling stable.
- Replace the thin desktop sidebar tab with a polished circular edge control, clearer open/close icon, tooltip, focus state, and smoother motion.
- Make VIDSTUCK Server 1 using its documented movie and TV embed paths, move the existing Videasy player to Server 2, and remove the currently dead Server 2 option.
- Keep playback progress handling compatible with both VIDSTUCK and Videasy messages.

## Technical details
- Add a dedicated loading state to the home banner rather than rendering nothing before trending content arrives.
- Extend the existing server type and URL builder for `https://vidstuck.xyz/embed/movie/{id}` and `https://vidstuck.xyz/embed/tv/{id}/{season}/{episode}`.
- Reuse existing semantic colors and button styling; no backend changes.
- Verify the home page visually at desktop and mobile sizes, check server numbering/URLs, and confirm the preview build is clean.
