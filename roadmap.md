<!-- Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude) -->
# Roadmap
## Toolbar and dropdown consistency
- [x] Match language dropdown to the shared 8px trigger gap and 300ms vertical disclosure; retain clock contents for closing animation and restore picker reveal/collapse. Language menu is 200px on desktop/tablet/phone; time picker 264px. Desktop gap and motion inspected; 834/360 menu screenshots checked; eight tests pass, build OK.
- [x] Replace native date/time popups with themed calendar and UTC time columns. Date selection and 09:30:05 UTC readback checked; 360/390 portrait screenshots captured; 15 focused tests pass and build OK. Software-GPU timeout prevented completing the landscape check.
- [x] Fix language menu rows inheriting toolbar icon dimensions; all seven desktop rows measured 184×44px with 16px flags, selection read back in French, no 390px overflow. Five locale tests pass; build OK.
- [x] 15 Nov follow-up: desktop/tablet region and toolbar sit 8px below the date strip; search has no cross (search icon closes), no input outline, 12px left padding, and takes the full toolbar row on phones; dropdowns only stop above cards under their column (desktop Quick Jump/Left Behind now reach the screen bottom); switches show a visible accent knob; phone region details open as a dropdown below the compact button and close other menus; info card header hover fills the whole strip. Checked 393px phone and 1280px desktop.
- [x] Correct shared grid open/close motion (no scale), keep Left Behind mounted for collapse, and restore full-height scrollable Quick Jump/menus. Search expands left in toolbar flow instead of covering controls; 8px edge spacing, pointer cursors and compact icon/arrow phone region with wide details. Verified 360/393 phones and tablet: matching menu bounds, no overflow/page errors; five focused tests pass. Hardware motion feel remains unmeasurable here.
- [x] Put Search in the toolbar; fixed 44px-height left-to-right expansion and reverse collapse, keyboard focus and on-demand results retained. Phones wrap with a usable second-row field.
- [x] Align dropdowns to measured toolbar dimensions, enlarge phone menus and remove obsolete card-open height caps while retaining measured card clearance.
- [x] Unify every More-menu row (48px minimum, left alignment, icons and spacing). Checked 360/390 phones, landscape, 768px tablet and desktop; no horizontal overflow/page errors; five focused tests pass. Scene quality unchanged.
## Complete remaining audit acceptance
- [x] Complete Voyager 1 (11 panels including six nested stages), Begin at Earth (28 stops) and signal form sends checked in 390×844 portrait / 844×390 landscape; real endings captured, no horizontal overflow or page errors in final run. Deterministic reduced-motion/manual Next checks, not real-device smoothness.
- [x] Bundled 3D verification succeeds with lavapipe: visible phone scene, 1.2% motion difference, zero page/request errors. Removed inactive zero-intensity composer causing SelectiveBloom warnings; no scene-quality reduction.
- [x] On-demand progress for photos and terrain above 500 KB, seven-language status, object-URL cleanup and three tests. Live slow-photo check: 8% visible above tour card, then completed 1280px image and progress cleared.
- [x] Four phone orientations checked without hiding canvas; no horizontal overflow or active undersized buttons. Keyboard photo/signal/close, pinch wiring with machine card, date edits and scrolling pass; axe reports zero violations in tested machine/date/knowledge states. Fixed clipped date controls and missing accessible names.
- [ ] Final real-device acceptance: actual iOS safe areas, all live-object glossary states, uninterrupted tour/signal/One last look motion and 30+ phone FPS need hardware GPU. Local mobile Lighthouse before/after 55 performance / 100 accessibility; TBT 7436→6526ms, FCP ~2420ms unchanged. Published audit still ERR_ABORTED; historical pre-feature baseline unavailable. Detailed measurements in AUDIT.md.
## Correct inaccurate maps and resolve texture rights
- [x] Replace eight misassigned files, fictional Ceres, and the two untraceable assets with eleven sourced WebP assets; source evidence and coverage limits in texture-sources.json and CREDITS.md. Phobos/Deimos assets corrected, but their catalogue bodies are absent and are not newly added.
- [x] Check renderer assignments, longitude transforms and live scene loading; 14 source regressions added, all 175 tests pass. Seven corrected textures read back from the actual visible scene; opening loader shares their URLs.
- [ ] Reliable motion acceptance still blocked by software GPU: Voyager 1's actual flight completed with a visible Jupiter screenshot, but only three distinct frames across 30 samples. Further run stalled on screenshot before Voyager 2/Apollo checks; no flicker-free claim or unproven camera edit.
## Phone, accessibility, clock and Left Behind audit
- [x] Fix confirmed touch-target, focus, hidden-menu keyboard, search/dropdown/card clearance and reduced-motion issues without adding features; every change listed in AUDIT.md.
- [x] Remove specific hot-loop vector/matrix/list allocations and redundant hidden-line updates; avoid unnecessary photo-manifest reads. Remaining evaluator/camera allocations disclosed in AUDIT.md.
- [ ] Finish comprehensive acceptance; 161 tests pass and keyboard next/photo/signal/close and four no-overflow viewport checks completed. Pinch/drag, every panel/date state, actual iOS safe areas and rendered contrast remain unverified; software renderer stalls prevent reliable measurements.
- [ ] Lighthouse acceptance blocked: published document load ERR_ABORTED, throttled baseline timed out, no historical pre-feature timing. No scores/FPS/loading improvement claimed; complete change report in AUDIT.md.
## Finish visual checks and texture-rights audit
- [x] Follow-up 15 November: identify eight more supplier sources without replacing assets. Phobos is fictional Ceres; Pluto/Iapetus fictional Haumea; Europa/Triton/Deimos fictional Makemake; Enceladus fictional Eris; Titan a Saturn-ring strip. Exact duplicate checks and supplier-original comparisons recorded in CREDITS.md. All 157 tests pass.
- [x] Retire the last two untraceable originals rather than invent their licences: Earth clouds replaced with directly fetched CC BY 4.0 INOVE map; base Moon derived from the already sourced LRO WAC HD map.
- [x] Replace all eight misassigned files and fictional Ceres; eleven replacements recorded with exact sources, hashes and transformations in CREDITS.md and texture-sources.json. Deimos is native 1440×720, never previously rendered; no artificial upscale. Existing mobile procedural fallbacks unchanged.
- [ ] Complete visible motion acceptance: a real Voyager 1 Launch → Jupiter transition and visible Jupiter frame were captured with the unchanged canvas; live camera-state samples were obtained, but capture delays and sparse sampling cannot prove flicker-free motion. Voyager 2, landings, phone glossary clearance, signal pulse and One last look rotation/rings still require reliable live visual checks.
- [ ] Finish visible-scene checks: machine-tour smoothness, phone glossary clearance, signal pulse and One last look rings/rotation still require a hardware-GPU device. This audit: 157 tests pass; saved signal restored in a fresh page; Begin at Earth reached its actual end frame with buttons present (settled animation capture stalled); all six One last look phone panels and continuation to step 5 checked with canvas hidden. No scene quality changed.
- [x] Compare supplier originals: initial ten maps plus eight follow-up files identified as Solar System Scope CC BY 4.0; attribution/conversion notices recorded. Only Earth clouds and the low-resolution Moon remain unidentified; misassigned fictional maps require separate correction. No assets changed.
## Opening-screen clock
- [x] Keep time advancing before the scene loads with one shared elapsed-time cursor. Opening readout ticks live; scene handoff checked with canvas hidden after mount to avoid software-GPU delays; 22 clock/tour tests pass. No scene-quality changes.
## Match entry and ending popups
- [x] Remove the summary-only black backdrop and transparent surface; match entry/summary headers and spacing to Send a signal. Desktop and 360px popup checks passed; five framing tests pass. Canvas hidden only for popup layout screenshots.
## Source and acceptance audit
- [x] Open all seven `verify: true` fact sources and confirm claims against NASA/APL/NIST. Preserve dated evidence and original-link limitations beside each fact; replace three insufficient primary links. Seven new regressions pass.
- [x] Run complete suite: 25 files / 153 tests pass; build OK. Live Apollo 11 entry and one flight's progress/completion observed without finishFlight. This does not prove visually smooth flights throughout every tour.
- [ ] Confirm uninterrupted tour visuals, phone glossary clearance, and full Begin at Earth ending on a hardware-GPU device. Fresh live checks stalled during phone/ending interactions; no acceptance claim made from incomplete runs.
## Complete framing acceptance
- [x] Voyager 1 summary completion verified; subsequently restyled to the shared Send a signal popup at the user's request. Begin at Earth remains unchanged.
- [ ] Verify uninterrupted camera flights, phone glossary clearance over a rendered object, and Begin at Earth through its ending. Blocker: software-GPU checks repeatedly stall; Begin at Earth reached all 26 stops but its ending capture did not finish.
## Consistent overlays and complete provenance
- [x] Share the tour-photo backdrop across Send a signal, Machines and How we know; add the NASA Space Apps Challenge line beneath both Left behind headings. Desktop/phone checked.
- [x] Re-check all 21 NASA image records and six simplified-path milestone sources; store real UTC retrieval timestamps and source URLs, with regression tests.
- [ ] Verify desktop/mobile overlay consistency, visible-canvas camera flights and glossary clearance over the live scene.
## Left Behind framing
- [x] Add entry-specific intro and seven distance-ordered machine choices with date-safe navigation; Apollo 11 launch and Voyager 2 card verified in the preview.
- [x] Add Voyager 1-only final summary without changing Begin at Earth or its end frame; last-stop completion verified on phone.
- [x] Add twelve translated glossary definitions, a sourced How we know drawer, exact repository credits and teacher questions. NASA image metadata and simplified-source retrieval dates now verified and stored.
- [x] Add machine search through the same navigation; Voyager 1 search selection verified, mobile introduction/list/drawer/summary screenshots checked; 132 tests pass. No new scene features; camera flights and glossary-on-object visual clearance remain unverified with the sandbox canvas hidden for UI checks.
## Signal spacing and Left Behind emphasis
- [x] Match mobile signal top clearance to the toolbar and equalise close-button top/right inset; 360px popup checked at y=32px with equal 8px header insets.
- [x] Place Left Behind first across devices, separate it on desktop and add a reduced-motion-safe occasional icon shake.
- [x] Add the NASA Space Apps Challenge proper-name subtitle to Left Behind text entries; phone menu and 360/768/1280px signal layouts checked in the preview (canvas hidden for UI checks only).
## Send a signal
- [x] Enable the Left Behind menu and MachineCard entry points with one shared glass view in all seven locales.
- [x] Calculate real-current-time distances, one-way light times and saved real-time progress for all seven machines; label provenance and logarithmic scale.
- [x] Add the selected-target true-light-speed scene pulse, reduced-motion handling, minute-limited announcements and reset.
- [x] Test physical rules and persistence; 129 Left Behind tests pass. Live send, menu reopen with saved message/countdowns, reset and MachineCard entry verified; desktop/360px screenshots checked, no overflow or runtime errors. Canvas hidden only for UI checks.
- [ ] Visually verify the moving pulse and fresh-page restoration on a hardware-GPU device; repeated sandbox scene/page checks stall. Local storage restoration and physical pulse speed pass isolated tests.
## Voyager 1 · One last look
- [x] Integrate all six parts into the shared Voyager 1 tour card, controls and collapse/swipe behaviour; number them 4.1–4.6. Live navigation, collapse, NASA photo toggle, Family Portrait selection and continuation to step 5 verified; desktop/360px card screenshots checked with canvas hidden only during UI testing. 31 focused tests pass; scene rendering unchanged.
- [x] Replace the placeholder with the staged, clock-paused experience and direct hash entry; live direct entry and continuation to heliopause verified.
- [x] Verify real-distance/angular-size calculations and identify Earth in both NASA images; credited photo toggle, pixel comparison and tappable Family Portrait verified.
- [x] Translate new narration and controls into all seven locales; 28 focused tests pass and app builds. Desktop controls checked with canvas hidden only during testing to avoid software-GPU stalls.
- [ ] Verify real-time camera rotation, six-ring readability and complete portrait-phone interaction on a hardware-GPU device; sandbox software rendering stalls during repeated scene checks, so these visual checks remain unverified.
## Whole-repository open-source release
- [x] Scan current files and reachable Git history: only allowed public anon keys detected; no private credentials/private URLs found. All six public application tables have RLS; some managed internal tables do not.
- [x] Add Apache 2.0 licence and update README, event scope and credits without app changes; unknown texture rights remain disclosed.
- [x] Remove the prior download directory, stored archive and redirect; verify official licence text and list all changed files in the release summary.
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
- [x] Verify the preview download: 239 ZIP entries, checksum matches, no download errors; report inventory, 65.62 MB and three upload batches.
