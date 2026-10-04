---
name: Vercel proxy routing
description: Routing principle for Vercel serverless functions used by the sports embed proxy.
---

For embed proxy rewrites, target a fixed API function and pass the route mode and captured path as query values. Strip those control values before forwarding the user's query to the embed provider.

**Why:** a Vercel-branded 404 appeared when the proxy rewrite targeted a nested catch-all function route, while Vercel documents rewrites to fixed API functions and exposes captured path parameters as query values.

**How to apply:** Keep the public embed routes mapped to the fixed proxy endpoint; validate the actual routing on Vercel after publishing.