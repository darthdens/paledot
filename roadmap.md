# Roadmap

## Left Behind setup
- [x] Add isolated Left Behind mode state, empty scene layer and exit overlay.
- [x] Connect Pale Dot Welcome, Satellite/More, title pill and #left-behind entry points after loading.
- [x] Verify entry/exit, unchanged normal mode and Cosmos isolation at desktop and 360px; three state/unit tests pass.
- [x] Fetch nine static trajectories and a photo manifest, retrying Opportunity and Viking coverage lookups.
- [x] Replace Cloud reads/rebuild with cached static reads and a read-only Pale Dot data table.
- [x] Update event provenance/credits and verify static data, preview tables, and photo suitability.
- [x] Save the three supplied documents and data files byte-for-byte.
- [x] Public storage removed from the plan; static repository files replace it.
- [x] Implement NASA fetching with TanStack server functions, cached client reads, and a Pale Dot-only hidden rebuild view; eight data tests pass.
- [x] Save all nine trajectories and sixteen photo slots as static files. Voyager 1/2 and Ingenuity use Horizons; Apollo, Viking and Opportunity retain simplified milestones. No photo placeholders remain.
- [x] Verify unauthenticated static read-back in desktop and 360px preview tables; no runtime errors or page overflow. Authenticated rebuilding is removed.

- [x] Migrate to TanStack Start (needed for separate link previews per domain)
- [x] Pale Dot (paledot.org): pick the branding from the domain, with its own title, description and share tags ("Pale Dot: explore the observable universe")
- [x] Pale Dot: show only the app, with a short intro + Continue button, then the explorer in full screen
- [x] Pale Dot: "Welcome to Cosmos Explorer" → "Welcome to Pale Dot" (EN/FR)
- [ ] Waiting on user: Pale Dot logo, colours, favicon, share image
- [ ] Waiting on user: unset cosmos.dens.so as primary domain
- [ ] Waiting on user: should the Echo chat bubble and cookie banner show on Pale Dot?
