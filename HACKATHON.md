# NASA Space Apps Challenge 2026: Pale Dot · Left Behind

- **Event:** NASA International Space Apps Challenge 2026, London (virtual) local event
- **Challenge:** Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars
- **Team:** Pale Dot (Dens Akoka)

## Before the event

Pale Dot (paledot.org) existed before the hackathon. The last commit before the event is the last commit dated before 14 November 2026, 09:00 GMT in the repo history.

- Wayback Machine snapshot of paledot.org before the event: [paste link]

## Started

14 November 2026, 09:00 GMT. This file was added to the repo through Lovable at the start of the event; every commit after it is hackathon work.

## What was built during the event

- Fixed body sizes to true scale across the whole app (planets, moons and the Sun had been drawn with their diameter as their radius).

- Everything in `src/features/left-behind/` and `public/left-behind/` was created during the event, including `public/left-behind/hardware.json` (compiled on 14 November 2026 from NASA, JPL, NSSDCA, LROC and PDS sources, with research help from Claude). Data was fetched from the JPL Horizons API and NASA Image and Video Library API during the event and saved as static files in `public/left-behind/`. The app reads these files without Cloud storage, functions or sign-in; missing sources are explicitly marked TODO(source).
- Every new code file starts with the comment `// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)`.
- Small, switched-off-by-default hooks were added to these existing files: `CosmosExplorer.tsx`, `TexturedPlanet.tsx`, `CameraController.tsx`, `CosmosUI.tsx`, `KeyboardShortcuts.tsx`, `PaleDot.tsx` (the #left-behind link) and `PaleDotTitleScreen.tsx` (one extra button). No new pages or routes: Left Behind is a mode inside the existing explorer.

## Use of AI

(The Space Apps form calls these Super Intelligence, or SI, tools.)

- Code: written by Lovable (an AI app builder) from my prompts, then checked and tested by me.
- Research, planning and debugging: Claude.
- Images: no AI-generated images are used. All photographs are NASA's, credited in `CREDITS.md`.

## Licence and credits

- Licence for the work created during the event: [MIT / Apache 2.0, as chosen; see LICENSE]
- Every library, font, texture, dataset and photo used, with its licence or credit: `CREDITS.md`

## Finished

- Submitted for judging: [date and time GMT]
- Everything built during the event: [compare link, or "repo is private"]
- Wayback Machine snapshot of paledot.org at submission: [paste link]
