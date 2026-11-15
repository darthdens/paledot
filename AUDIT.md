<!-- Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude) -->
# Clock and Left Behind audit — 15 November 2026

## Changes made
- Shared 44px minimum button/input targets across Pale Dot; toolbar icons, machine header controls and machine actions no longer use smaller desktop/tablet targets. Existing pin/marker 44px areas preserved.
- Shared full-opacity semantic accent focus outlines; darker, semantic menu/search surfaces and semantic machine-card text instead of translucent white text. Muted token against the card token calculates to 5.42:1. This is not a blanket rendered contrast certification.
- Search trigger, input, close button, Quick Jump close and toolbar commands now have translated accessible names using the existing translation system.
- Hidden More, language and Quick Jump menus are inert; hidden region details are inert.
- More commands, search results, machine photo buttons and crowd chips use the existing Button primitive.
- Search opens below the toolbar; region label reserves the enlarged toolbar width. Dropdowns scroll within available space above bottom cards, with a conservative 25dvh cap while cards are open. ResizeObserver/DOM changes update clearance, not scene frames.
- Machine, information and tour cards use safe-area bottom/side clearance; phone and short landscape cards use full available width and constrained scrollable content.
- Tour header no longer has a mouse-only clickable div; its existing accessible collapse button remains.
- Scene and tour shortcuts no longer steal Space/arrows from buttons, inputs or dialogs. Closing a tour photo no longer exits the underlying tour. Added four behavioral regressions.
- Reduced-motion styles remove UI transitions/animations; ordinary camera flights and ongoing hardware flights cut to their destination. Existing signal-pulse suppression retained.
- 3D view has a simulation-date accessible description translated into all seven locales; tour narration is atomic polite live content.
- Machine photo buttons use the shared component; existing descriptive alt text retained.
- Tours with no photo IDs no longer request the NASA photo manifest; framing requests it only for How we know. Trajectories still load after boot when the visible machine layer needs them, not behind the opening loader.
- Signal pulse reuses vectors and a selected-row lookup rather than allocating positional arrays every frame.
- SitePatch reuses vectors instead of allocating vectors/clones every frame.
- Surface pins reuse their inverse matrix, ground vector and registry record; crowd detection reuses vectors, lists and projection points.
- Hardware tracks reuse their published coordinate array/date, use binary search instead of reverse/filter arrays, and skip rebasing hidden line buffers. Existing setDrawRange and geometry lifetime retained.

## Verified
- 27 test files / 161 tests pass, including the four new keyboard-scope tests.
- Preview build passes.
- Keyboard activation advanced Voyager 1 to Jupiter, opened a NASA photo, closed it without stopping the tour, opened Send a signal, sent “Audit”, and closed the dialog.
- Checked viewport dimensions 360×740, 390×844, 740×360 and 844×390: no document horizontal overflow. Initial touch scan found no active undersized buttons after hidden Quick Jump became inert.
- Visible scene/Jupiter capture obtained before changes; UI-only later checks hid the canvas to avoid software-renderer stalls. Do not treat those as pinch/drag or motion verification.

## Not accepted / still needs reliable measurement
- A final phone menu/card overlap was found in early measurements; conservative card-open cap added. Final cap requires recheck below.
- Pinch/drag with cards, hardware-GPU tour smoothness, safe-area behavior on actual iOS, full focus path from title/menu entry, all MachineCard/InfoCard/date states and rendered contrast coverage are not fully verified.
- Accessibility scanner stalled before results; no accessibility score claimed.
- Published mobile Lighthouse attempted on paledot.org: FAILED_DOCUMENT_REQUEST / net::ERR_ABORTED; no performance or accessibility score returned. No deployment was made, so published pages do not yet include these fixes.
- Four-times CPU-throttled baseline failed to reach the scene hook within 90 seconds; valid before/after FPS and loader-duration figures are unavailable. Software WebGL is not a mid-range phone GPU. No 30fps or loading-regression claim made.
- Historical pre-Left-Behind performance baseline is unavailable; comparing against it cannot be proven with the present checkout.
- Trajectory JSON files are below 500KB (largest ~234KB); manifest ~34KB. Large photo/terrain download progress remains unresolved; no new dependency or feature introduced.
- Some allocation remains in trajectory evaluation, nearest ranking and camera flight helpers; this audit reduces specific hot-loop allocation, does not certify zero allocation throughout the feature.
- No console page errors appeared in completed keyboard/phone runs; warnings across every feature state remain unverified.

No Echo, analytics, Capacitor, scale, texture quality or tour content changes were made in the original accessibility audit.

## Follow-up: incorrect maps and rights — 15 November 2026
- Removed eleven old binaries: the eight misassigned assets, fictional Ceres, and unidentified Earth clouds/base Moon. Replaced with traced CDN WebP assets; attribution, URLs, projection conversions, hashes and limitations in CREDITS.md and texture-sources.json.
- Seven rendered worlds now use body-specific mission mosaics: Ceres (Dawn), Pluto (New Horizons), Europa (Voyager/Galileo), Enceladus/Iapetus/Titan (Cassini/Voyager) and Triton (Voyager 2). Base Moon uses the already documented HD LRO WAC mosaic; Earth clouds use the supplier's directly fetched CC BY 4.0 map, not an assumed licence for the old file.
- Corrected retained Phobos and Deimos assets. Neither has a body entry in the current catalogue, so neither was rendered; no new objects or features added. Deimos remains its official source's native 1440×720 instead of upscaling to invent detail. Main maps retain 2048×1024 and base Moon 1024×512.
- Sourced textures bypass fictional hearts, cracks, tiger stripes, cantaloupe patterns and albedo-derived fake relief in the existing shaders. Lighting, real relief, scale, camera and tours remain unchanged. Titan keeps orange haze over its infrared mosaic; this is not measured visible-light colour.
- Missing Pluto/Triton/Europa observations have alpha coverage and uniform neutral material, not black terrain or fabricated fill. West-positive mosaics mirrored and 0..360 east-positive sources shifted according to their labels. All changes documented; no AI imagery.
- Opening loader and planet renderer share the corrected asset URLs. Live scene readback confirms all seven corrected world textures are loaded at 2048×1024 with the sourced-surface shader active. This does not certify every world at every close-up angle or actual iOS rendering.
- Added 14 source/accuracy regressions. Complete suite: 28 files / 175 tests pass; preview build OK. No page errors in the completed visible-scene run.
- Retried unmodified visible scene: Voyager 1's actual Launch→Jupiter camera flight completed and Jupiter screenshot captured. Thirty samples over 8.89 seconds yielded only three distinct camera frames in the software renderer; this cannot prove flicker-free motion or phone FPS. Another run stalled at screenshot capture before Voyager 2/Apollo checks. Those, signal-pulse motion and One last look rotation remain blocked on reliable GPU visual checks; no unverified camera change made.
- Original licence identities are still unknowable, but those files are no longer shipped; the replacement sources close the active-asset rights gaps. Older historical comparison statements in CREDITS.md are explicitly retired evidence, not current assignments.

## Acceptance completion work — 15 November 2026

### Every change
- Added streaming progress for on-demand photos and site terrain above 500,000 bytes, including unknown-length transfers once they cross the threshold. Status is translated in all seven locales, positioned above an open bottom card, and does not intercept gestures. Progress is throttled to download events, not scene frames.
- Photo slots use visibility-triggered downloads, preserve alt text, reuse native HTTP cache and revoke object URLs/abort on unmount. Machine photos, tour thumbnails/viewers and One last look photos share this path. Terrain textures and site heights report through the same progress store; no additional opening-screen prefetch.
- Removed the inactive zero-intensity SelectiveBloom/empty composer that emitted missing-light warnings. The effect had intensity zero; no visual-quality setting, geometry, lighting, scale or active effect reduced.
- Canvas wrapper uses an accessible group instead of an image role around interactive markers. Fullscreen and sound buttons have accessible names; hidden sound controls are inert and the slider thumb receives its accessible name.
- One last look keyboard handling uses the shared scope guard, preventing scene shortcuts from stealing keys inside dialogs/inputs.
- Fixed date control's nested overflow clipping: all date/speed/scrubber options can now scroll within the shared dropdown. Phone landscape previously hid the lower controls.
- Added three download regressions (500 KB threshold, streaming completion/cleanup, failure cleanup). No dependencies added. All 178 tests across 29 files pass; preview build OK.

### Checks actually completed
- Real canvas retained at 360×740, 390×844, 740×360 and 844×390: no document horizontal overflow; active button/input scan found no targets under 44px. Tour/menu bounds did not overlap; date fields scroll in 52–211px available dropdown heights.
- Keyboard Next→photo→Escape keeps tour open; Send a signal sends “Acceptance” and closes. Machine card opens; injected two-touch pinch changes actual camera position with the card open. This verifies browser touch wiring, not physical iPhone feel.
- Date input edits read back as 1990-02-14T12:00:00Z in all four orientations. Machine/date/How we know tested states have zero axe WCAG A/AA violations after fixes. No page errors in completed flows. This is not every language/photo/device state or a universal contrast certification.
- Actual slow photo response: “Downloading · 8%” visible above the tour at x124/y455 on 390×844, then status clears and the real 1280px image reads back complete via its blob URL.
- Bundled **3d-game** verification now completes using lavapipe without hiding the canvas: phone screenshot nonblank (mean luminance 14, standard deviation 33.2), 1.2% pixels changed over 1000ms, no page errors or failed asset requests. Only software-driver ReadPixels stall warnings remain.
- Apollo 11 transition produced eight distinct camera positions over sixteen samples and completed; Voyager 2 endpoint captured after photo loading, but that sampling window missed the flight itself. Nested One last look entry in this final run timed out; no claim of complete motion acceptance.

### Measured before/after and remaining blockers

Local mobile Lighthouse with Left Behind code present, same sandbox Chrome:

| Metric | Before this follow-up | After |
| --- | ---: | ---: |
| Accessibility | 100 | 100 |
| Performance | 55 | 55 |
| FCP / LCP | 2420 ms | 2421 ms |
| Total blocking time | 7436 ms | 6526 ms |
| Speed index | 15560 ms | 15410 ms |

These are single-run development-server/software-GPU measurements, not production or mid-range phone results. No meaningful first-paint regression in this pair; this is not proof of historical pre-Left-Behind parity or unchanged full-loader duration.

Controlled 390×844 lavapipe scene runs: NASA layer off 37.96s scene-ready, 1.14 FPS (7 frames/6.13s); layer on 40.77s scene-ready, 0.82 FPS (5 frames/6.07s). These are software-renderer timings and layer-state comparison, **not before/after code FPS** or a phone profile; the layer switch occurs after readiness, so the readiness difference is run-to-run variability, not layer-loading causation.

Published paledot.org mobile Lighthouse still fails document navigation with ERR_ABORTED despite an HTTP 200 fetch; fixes were not published automatically. No production score claimed. Historical pre-feature code/performance baseline is unavailable. The sandbox cannot be converted into a physical GPU; smoothness, 30+ phone FPS, true iOS safe-area behaviour, full visible-object glossary clearance, signal pulse and uninterrupted One last look rotation remain hardware-dependent. To check those states, open the preview's Left Behind menu and play Voyager 1/Voyager 2/Apollo 11, then Send a signal; One last look is Voyager 1 step 4.1–4.6. No scene quality was reduced to disguise these limits.
## Complete phone flows — 15 November 2026, 13:41 UTC
- Checked at 390×844 portrait and 844×390 landscape with mobile/touch Chromium and the real canvas retained (lavapipe).
- Voyager 1: advanced all 11 displayed panels using the actual Next button, including all six One last look stages 4.1–4.6; returned to regular steps 5/6 and reached the shared seven-machine summary in both orientations.
- Begin at Earth: advanced all 28 current registry stops with Next and reached the genuine Pale Dot end frame (Go again / Back to Earth / Share / 46.5 billion light-years) in both orientations. Landscape end frame screenshot confirms visible controls/credit without horizontal overflow.
- Sent a distinct signal in each orientation via the actual form. Read back the saved message from the disabled input and confirmed send-time countdown/arrival rows in screenshots. Message is an input value, not body text. Signal sending is simulated; nothing transmitted.
- All sampled tour-panel rectangles stayed within viewport bounds, with no document horizontal overflow. Landscape summary content scrolls within its dialog; lower rows are not all simultaneously visible.
- Final landscape run had no page errors. Portrait run completed both tours and signal, then its attempted same-URL navigation timed out; reran landscape successfully in a fresh session instead of treating that harness navigation as a product defect.
- Verification used reduced-motion cuts, paused tour autoplay and the existing finishFlight development hook to make every UI step deterministic. This proves complete navigation/endings and signal send, **not uninterrupted autoplay, camera smoothness, physical phone/iOS safe areas or hardware-GPU frame rate**. No application code changed.
