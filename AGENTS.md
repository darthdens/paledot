# Project rules

- Stack is TanStack Start (SSR) with file routes in `src/routes/`; react-router-style imports go through `src/lib/router-compat.tsx`. Why: SSR lets each domain serve its own link-preview tags.
- One app serves two brands; `src/lib/site-brand.ts` picks the brand from the request host (`?site=` overrides for previews), and `src/lib/site-meta.ts` holds per-brand head tags. Why: both domains must share every update but stay separately branded.
- The 3D explorer and page components load client-only (lazy, after mount) from `src/routes/index.tsx`. Why: three.js/WebGL can't run during server rendering.
- The Echo AI widget script is injected after hydration in `__root.tsx`, never as a head/body tag. Why: it adds DOM nodes to <body> that break React hydration.
