# Project rules

- Stack is TanStack Start (SSR) with file routes in `src/routes/`; react-router-style imports go through `src/lib/router-compat.tsx`. Why: SSR lets each domain serve its own link-preview tags.
- One app serves two brands; `src/lib/site-brand.ts` picks the brand from the request host (`?site=` overrides for previews), and `src/lib/site-meta.ts` holds per-brand head tags. Why: both domains must share every update but stay separately branded.
- The 3D explorer and page components load client-only (lazy, after mount) from `src/routes/index.tsx`. Why: three.js/WebGL can't run during server rendering.
- The Echo AI widget script is injected after hydration in `__root.tsx`, never as a head/body tag. Why: it adds DOM nodes to <body> that break React hydration.
- Left Behind data is fetched from the JPL Horizons API and NASA Image and Video Library API during the event and saved as static files in `public/left-behind/`; feature code stays in `src/features/left-behind/` and reads only through its cached data client, with no Cloud storage, functions or auth. Why: keep the layer isolated, reproducible and available without a data service.
- Left Behind stores only menu and machine UI state; Pale Dot mounts its layer after boot when machinesVisible, and title/hash requests open the menu after boot. Why: machines belong to the same universe, not an alternate mode.

- Solid-body renderers and close-up navigation use the shared bodyScale helpers; catalogue sizes remain diameters and positions are untouched. Why: both brands/modes must agree on radius, camera clearance and portrait framing.
- In development only, window.__cosmosCheck exposes live state(), snapshot() and finishFlight(); the canvas marks data-scene-ready after drawing. Why: verify complete tours and true radii without duplicating stores or waiting for software-GPU animation time.
- Both brands share useSimClock and dynamically loaded ephemerides; one pre-motion useFrame advances UTC time in simulated seconds per real second, and Begin at Earth saves/restores clock playback. Why: every Solar System object uses one real-date universe.

- Welcome and Left Behind menus share TourChoices; only implemented tours are launchable. Why: every entry offers the same options without substituting another tour for unfinished machine tours.
