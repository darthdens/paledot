<!-- Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude) -->
# Roadmap
## Tour autoplay
- [x] Correct milliseconds/seconds mismatch; slide-keyed autoplay retains elapsed time through pause/resume. Live Voyager 1 advances from launch through Jupiter to Saturn without Next; screenshot checked, no runtime errors, 103 tests pass.
## Tour viewpoints and archival photographs
- [x] Frame Voyager flybys around their encounter planets and spacecraft; One last look points towards the Sun. Live Voyager 1 Jupiter/Saturn midpoint and Sunward direction verified; real-device smoothness remains unverified.
- [x] Show sourced NASA photographs in every tour, using WebP assets and translated captions. All machine slides have imagery; Begin at Earth uses relevant existing-body photographs, without assigning unrelated NASA photos to galaxies.
- [x] Audit all supported tour titles/narrations and photo captions; verify live Voyager 1 steps and enlarged photo viewer. Screenshot checked with canvas hidden solely to avoid software-GPU stalls.
## Guided-tour continuity
- [x] Fix shared machine transitions, date jumps and stale host navigation.
- [x] Replace unfinished rover narration with sourced content; guard surface cut-outs until caps are ready and near.
- [x] Frame Voyagers close in deep space and show only the active machine's tour trail.
- [x] Verify every stop of all seven tours and exit through the live explorer; 90 tests pass, including original-tour preservation. Tour-card screenshot checked. Real-device smoothness and visual Moon occlusion remain unverified; software-GPU checks use finishFlight, not real-time animation.
- [x] Match NASA Quick Jump category structure and selected-object panel; desktop/360px screenshots, category exclusivity, Voyager selection, follow toggle and close checked. UI screenshots hide the canvas to avoid software-GPU stalls; no scene changes made.
- [x] Replace Left Behind mode with Pale Dot-only menu and machine visibility.
- [x] Share real-date clock, ephemerides, orbital motion and date controls across both brands.
- [x] Preserve tour clock state and calculate InfoCard distances.
- [x] Verify physical alignments, all entries, both brands and explorer navigation.

Verification: 24 tests pass; four Pale Dot entries and desktop/360px date checks pass; Cosmos date/alignment checks pass; first/final tour Earth framing checked. Complete 28-stop tour, real-device performance, Quick Jump/search and end-frame completion were not rechecked end-to-end.

## Consistent Left Behind controls
- [x] Match Satellite and welcome button dimensions; use the same glass menu skin.
- [x] Give enabled machine toggle the selected Pale Dot accent.
- [x] Add shared original/machine tour chooser; unfinished machine tours stay disabled.
- [x] Verify menu styling, selection and original tour launch at desktop and 360px.

## Single clock control
- [x] Remove duplicate date chip; reveal date from existing Clock control.
- [x] Style date/time fields, show seconds and add 1 minute/s.
- [x] Verify desktop/mobile controls and speed tests.

## Machines layer
- [x] Add cached trajectory interpolation, simplified arcs and Voyager extrapolation.
- [x] Draw paths and screen-size markers; add camera following and full-path toggle.
- [x] Add translated selected-machine measurements and dismissible scale note.
- [x] Verify Voyager milestones and actual marker selection/readout; desktop scene loads without runtime errors. Mobile screenshot and full visibility-flow checks remain unverified because the software-GPU browser timed out.

## Navigation and visual consistency audit
- [x] Add available NASA machines to Quick Jump with follow navigation; Voyager selection/readout checked through the actual menu.
- [x] Anchor dropdowns to the explorer and match machine cards to InfoCard spacing/actions; desktop/360px explorer screenshots checked.
- [x] Correct trail buffer/local coordinates, orbit epoch alignment, and machine-path precision/sorting.
- [x] Add credited NASA model inspection without changing true-scale universe objects; five GLBs validated and decoded. Lunar-rover model is not supplied, and models are inspection-only.
- [x] Run focused tests and desktop/mobile scene checks. Real-device flicker and full model-inspection screenshots remain unverified: software-GPU interactions timed out.

## Machines in the universe
- [x] Show NASA models in the 3D universe as screen-size markers (Voyager 1 checked in preview).
- [x] Category badge in the selected-machine panel, all languages.

## Checkpoint paperwork and source package
- [x] Update event scope from history and complete requested credits; original low-resolution texture origins remain unknown and explicitly disclosed.
- [x] Create and inspect the event source ZIP and per-file baseline patches, without secrets; archive externalized due to repository size limit.
- [ ] Verify the preview download and report contents, size and upload batches.
