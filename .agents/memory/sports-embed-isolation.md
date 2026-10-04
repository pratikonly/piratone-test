---
name: Sports embed isolation
description: Security tradeoffs when routing embed.st content through the app's origin.
---

When proxying `embed.st` through the app's domain, keep its hidden `/ad.html` frame inert instead of relaying its HTML, and sandbox the player iframe without `allow-same-origin`.

**Why:** the hidden 1×1 frame appears separate from the player, and relaying third-party executable HTML on the app's origin would expose same-origin access. The sandbox may block playback if the provider depends on cookies or local storage, so its effect must be verified in Chrome.

**How to apply:** Do not remove the ad-frame response or loosen the iframe sandbox without evidence it is required for playback and a safer isolated origin.