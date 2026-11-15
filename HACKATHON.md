# NASA Space Apps Challenge 2026: Pale Dot · Left Behind

- **Event:** NASA International Space Apps Challenge 2026, London (virtual) local event
- **Challenge:** Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars
- **Team:** Pale Dot (Dens Akoka)

## Before the event

Pale Dot (paledot.org) existed before the hackathon. The last commit before the event is the last commit dated before 14 November 2026, 09:00 GMT in the repo history.

- Wayback Machine snapshot of paledot.org before the event: https://web.archive.org/web/20261021162756/https://paledot.org/ (21 October 2026, 16:27:56 UTC; verified in the Wayback CDX index).

## Started

14 November 2026, 09:00 GMT. This file was added to the repo through Lovable at the start of the event; every commit after it is hackathon work.

## What was built during the event

Last commit before the event: c76c475 (22 Oct 2026). First commit of the event: ae6b56e (14 Nov 2026, 10:39 GMT).

History note: ae6b56e is the first named Left Behind feature commit, not the first timestamped commit after the event start. The repository also contains setup/working commits from f096524 (14 Nov 2026, 10:30:25 GMT) through 1a1802c (10:39:16 GMT). The earlier checkpoint build log included those setup commits; repository history remains the authoritative record now that the temporary download package is removed.

- One app-wide real-date UTC simulation clock and date control, shared by both brands; astronomy-engine supplies dated planet and Moon positions. Playback, speeds, date selection and the persistent date readout use that clock.
- True-scale body radii across the existing app, correcting catalogue diameters previously used as radii; shared bodyScale helpers also govern framing and camera clearance.
- A Pale Dot-only NASA machines layer in the existing universe, not a separate mode or app: cached JPL Horizons trajectories, explicitly simplified paths where only milestones are available, Moon/Mars landing pins attached to rotating surfaces, descent arcs, true-size NASA 3D models, and clearly identified simplified rover/reflector stand-ins.
- A Left Behind menu and seven guided machine tours registered in the existing tour engine, alongside the preserved Begin at Earth tour. Machine tours drive dates/following, show credited archival photographs and active-machine trails, and end in their own summaries. Anchored camera transitions and encounter/Sunward viewpoints were added; these are narrative views, not measured spacecraft attitudes.
- NASA surface imagery and terrain: Moon Trek/LRO WAC and NAC, Mars Trek/Viking and HiRISE/CTX (including the Esri OnMars service), GIBS Blue/Black Marble, LOLA Moon relief, MOLA Mars relief, NOAA ETOPO1 Earth relief, landing-site DTMs, MESSENGER Mercury relief and Dawn Ceres relief. Global maps/heights load behind the opening screen; site data stays in the cached static layer. Coverage and resolution vary; this is not detailed measured terrain on every world.
- Visual realism work in existing renderers: Sun and Proxima surface/glow treatments, atmosphere profiles, sunlight and distance response, Earth cloud altitude and clock-driven motion, terrain normals and near-surface precision. Some colour/glow choices are perceptual approximations, not calibrated observations.
- Existing-app UI changes: navigation/following, NASA categories and shared panels in Quick Jump, menu spacing and mobile placement, language-picker placement, translated tour/card content, and date controls. Images were converted to WebP except platform icons/social previews. Left Behind remains on the homepage, with no new content pages.
- New feature code is in `src/features/left-behind/`; data in `public/left-behind/`; fetching/build scripts in `scripts/left-behind/` and `scripts/relief/`. New shared modules include the tour registry, HD surface loader, relief renderer and atmosphere renderer. New event code carries the Left Behind provenance comment. NASA/JPL data was fetched during the event and cached; the runtime does not contact NASA or use Cloud storage, functions or sign-in for this layer.

### Every pre-event file changed during the event

This list intersects files present at c76c475 with all commit changes since 14 Nov 2026 09:00 GMT; it includes deletions, tooling/generated changes and any changes later reverted. Compare the repository history against c76c475 to inspect the changes; temporary source-package download files have been removed. Event documentation and release paperwork are also included in this history-based inventory.

- `AGENTS.md`
- `bun.lock`
- `package.json`
- `roadmap.md`
- `src/assets/dens-portrait.jpg`
- `src/assets/logo.png`
- `src/assets/textures/ceres.jpg`
- `src/assets/textures/deimos.jpg`
- `src/assets/textures/earth-clouds.jpg`
- `src/assets/textures/earth-day.jpg`
- `src/assets/textures/earth-night.jpg`
- `src/assets/textures/enceladus.jpg`
- `src/assets/textures/europa.jpg`
- `src/assets/textures/iapetus.jpg`
- `src/assets/textures/jupiter.jpg`
- `src/assets/textures/mars.jpg`
- `src/assets/textures/mercury.jpg`
- `src/assets/textures/moon.jpg`
- `src/assets/textures/neptune.jpg`
- `src/assets/textures/phobos.jpg`
- `src/assets/textures/pluto.jpg`
- `src/assets/textures/saturn.jpg`
- `src/assets/textures/titan.jpg`
- `src/assets/textures/triton.jpg`
- `src/assets/textures/uranus.jpg`
- `src/assets/textures/venus.jpg`
- `src/brand/paledot/PaleDotTitleScreen.tsx`
- `src/components/Logo.tsx`
- `src/components/SocialIcons.tsx`
- `src/components/cosmos/CameraController.tsx`
- `src/components/cosmos/CosmosExplorer.tsx`
- `src/components/cosmos/ScaleTracker.tsx`
- `src/components/cosmos/data/tourStops.ts`
- `src/components/cosmos/objects/AsteroidBelt.tsx`
- `src/components/cosmos/objects/Comet.tsx`
- `src/components/cosmos/objects/Earth.tsx`
- `src/components/cosmos/objects/KuiperBelt.tsx`
- `src/components/cosmos/objects/MoonOrbit.tsx`
- `src/components/cosmos/objects/OrbitalTrail.tsx`
- `src/components/cosmos/objects/Planet.tsx`
- `src/components/cosmos/objects/ProximaCentauri.tsx`
- `src/components/cosmos/objects/SolarSystemContent.tsx`
- `src/components/cosmos/objects/Sun.tsx`
- `src/components/cosmos/objects/TexturedPlanet.tsx`
- `src/components/cosmos/objects/TrojanAsteroids.tsx`
- `src/components/cosmos/store/useCosmosStore.ts`
- `src/components/cosmos/types.ts`
- `src/components/cosmos/ui/AboutModal.tsx`
- `src/components/cosmos/ui/CosmosLoader.tsx`
- `src/components/cosmos/ui/CosmosUI.tsx`
- `src/components/cosmos/ui/InfoCard.tsx`
- `src/components/cosmos/ui/KeyboardShortcuts.tsx`
- `src/components/cosmos/ui/QuickJumpMenu.tsx`
- `src/components/cosmos/ui/TourOverlay.tsx`
- `src/components/cosmos/ui/YouAreHereLabel.tsx`
- `src/integrations/supabase/previewAuthStorage.ts`
- `src/pages/PaleDot.tsx`
- `src/routeTree.gen.ts`
- `src/routes/index.tsx`
- `src/styles.css`

## Use of AI

(The Space Apps form calls these Super Intelligence, or SI, tools.)

- Code: written by Lovable (an AI app builder) from my prompts, then checked and tested by me.
- Research, planning and debugging: Claude.
- Images: no AI-generated images are used. All photographs are NASA's, credited in `CREDITS.md`.

## Licence and credits

- Apache License 2.0 (whole repository), see LICENSE
- Every library, font, texture, dataset and photo used, with its licence or credit: `CREDITS.md`

## Finished

- Submitted for judging: 15 November 2026, 20:45 GMT
- Everything built during the event: https://github.com/darthdens/paledot/compare/c76c475...main
- Wayback Machine snapshot of paledot.org near submission: https://web.archive.org/web/20261115204404/https://paledot.org/ (15 November 2026, 20:44:04 GMT; captured 56 seconds before the recorded submission time). Wayback returned the capture URL and HTTP 200 with the matching Memento timestamp. This archives the published homepage response, not a verified offline copy of every interactive asset.
