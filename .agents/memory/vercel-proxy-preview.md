---
name: Vercel proxy preview
description: Limits of testing Vercel serverless endpoints in Replit's Vite preview.
---

Replit's configured `npm run dev` workflow uses Vite and does not execute Vercel `api/*.ts` handlers. Same-origin `/api/...` calls to those handlers therefore return 404 in the local preview, even though the functions are deployable on Vercel.

**Why:** the project is deployed on Vercel, while the Replit preview runs a frontend-only Vite server.

**How to apply:** Verify Vercel function behavior after deployment or configure an explicit local runtime/adapter; don't treat local Vite 404 responses as provider API failures.