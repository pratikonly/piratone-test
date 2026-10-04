---
name: Node package setup
description: Replit's Node package installer can resolve declared semver ranges to newer releases and rewrite project setup files.
---

When restoring missing Node dependencies through Replit's package installer, supplying existing ranged versions can still resolve newer compatible releases and rewrite `package.json`, the lockfile, and `.replit`.

**Why:** A dependency restore unexpectedly upgraded declared versions and added a Nix channel entry; the app built, but those changes were unrelated to the requested code work.

**How to apply:** After dependency setup, inspect `package.json`, the lockfile, and `.replit`; keep only necessary changes and validate that the lockfile still satisfies the declared ranges.

When a lockfile contains `resolved` URLs for Replit's internal package mirror, `npm install --package-lock-only` may report “up to date” and preserve them, even with a public `--registry` and `--replace-registry-host=always`. A Replit-injected `npm_config_registry` can also override the project `.npmrc` locally.

**Why:** CI outside Replit follows the lockfile's `resolved` tarball URLs, while Replit's internal mirror is unreachable there; npm's successful no-op does not make those URLs portable.

**How to apply:** Keep the project registry set to `https://registry.npmjs.org/`, normalize only the lockfile URL prefix when necessary, and verify that package versions and integrity metadata remain unchanged. For local checks in a mirror-injected environment, set `npm_config_registry=https://registry.npmjs.org/` and pass `--registry=https://registry.npmjs.org/`.