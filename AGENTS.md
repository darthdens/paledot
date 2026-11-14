# Project rules

- Stack is TanStack Start (SSR) with file routes in `src/routes/`; react-router-style imports go through `src/lib/router-compat.tsx`. Why: SSR lets each domain serve its own link-preview tags.
- One app serves two brands; `src/lib/site-brand.ts` picks the brand from the request host (`?site=` overrides for previews), and `src/lib/site-meta.ts` holds per-brand head tags. Why: both domains must share every update but stay separately branded.
- The 3D explorer and page components load client-only (lazy, after mount) from `src/routes/index.tsx`. Why: three.js/WebGL can't run during server rendering.
- The Echo AI widget script is injected after hydration in `__root.tsx`, never as a head/body tag. Why: it adds DOM nodes to <body> that break React hydration.
- Left Behind data is fetched from the JPL Horizons API and NASA Image and Video Library API during the event and saved as static files in `public/left-behind/`; feature code stays in `src/features/left-behind/` and reads only through its cached data client, with no Cloud storage, functions or auth. Why: keep the mode isolated, reproducible and available without a data service.
- Left Behind has independent Zustand state; title/hash entry is queued until explorer boot completes, and its scene/UI load lazily only for active Pale Dot. Why: preserve the existing loader, tour state and Cosmos behavior.

- Solid-body renderers and close-up navigation use the shared bodyScale helpers; catalogue sizes remain diameters and positions are untouched. Why: both brands/modes must agree on radius, camera clearance and portrait framing.
