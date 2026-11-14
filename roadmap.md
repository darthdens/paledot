# Roadmap

## Left Behind setup
- [x] Save the three supplied documents and data files byte-for-byte.
- [ ] Create public left-behind storage — blocked by workspace public-bucket policy; owner/admin must enable public buckets in Settings → Privacy & Security.
- [x] Implement NASA fetching with TanStack server functions, cached client reads, and a Pale Dot-only hidden rebuild view; eight data tests pass.
- [ ] Store all nine trajectories and the complete manifest — public storage is blocked; two photo searches have no title-qualified result. Voyager 1/2 and Ingenuity were fetched from JPL; Apollo, Viking and Opportunity use explicit simplified milestones.
- [ ] Verify authenticated rebuilding and read-back — no owner auth account is available, and public storage is blocked.

- [x] Migrate to TanStack Start (needed for separate link previews per domain)
- [x] Pale Dot (paledot.org): pick the branding from the domain, with its own title, description and share tags ("Pale Dot: explore the observable universe")
- [x] Pale Dot: show only the app, with a short intro + Continue button, then the explorer in full screen
- [x] Pale Dot: "Welcome to Cosmos Explorer" → "Welcome to Pale Dot" (EN/FR)
- [ ] Waiting on user: Pale Dot logo, colours, favicon, share image
- [ ] Waiting on user: unset cosmos.dens.so as primary domain
- [ ] Waiting on user: should the Echo chat bubble and cookie banner show on Pale Dot?
