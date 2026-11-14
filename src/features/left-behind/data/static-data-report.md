<!-- Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude) -->

# Left Behind static data verification

Fetched during the event and saved in public/left-behind/. All 15 tests pass. Desktop and 360px preview tables read back nine trajectories and sixteen photos without sign-in. Normal Pale Dot and Cosmos show no tables.

## Trajectories

Sources: `horizons` = Calculated from JPL Horizons data; `simplified` = Simplified path. Points are saved vector samples, not telemetry.

| ID | Source | Horizons target | Actual date range (UTC) | Points | Bytes |
| --- | --- | --- | --- | ---: | ---: |
| apollo-11 | simplified | — | 1969-07-16T13:32:00Z → 1969-07-20T20:17:00Z | 0 | 255 |
| apollo-15 | simplified | — | 1971-07-26T13:34:00Z → 1971-07-30T22:16:00Z | 0 | 255 |
| apollo-16 | simplified | — | 1972-04-16T17:54:00Z → 1972-04-21T02:23:00Z | 0 | 255 |
| apollo-17 | simplified | — | 1972-12-07T05:33:00Z → 1972-12-11T19:55:00Z | 0 | 255 |
| ingenuity | horizons | -168 | 2020-07-30T12:51:35+00:00 → 2021-02-18T20:55:00+00:00 | 277 | 9379 |
| opportunity | simplified | — | 2003-07-08T03:18:00Z → 2004-01-25T05:05:00Z | 0 | 255 |
| viking-1 | simplified | — | 1975-08-20T21:22:00Z → 1976-06-19T00:00:00Z | 0 | 252 |
| voyager-1 | horizons | -31 | 1977-09-06T00:00:00+00:00 → 2029-12-30T00:00:00+00:00 | 5070 | 185503 |
| voyager-2 | horizons | -32 | 1977-08-21T00:00:00+00:00 → 2029-12-28T00:00:00+00:00 | 6027 | 217830 |

Opportunity: retried MER-1 and Opportunity lookups; no date-qualified cruise record. Viking 1: retried Viking 1 lookup; no usable cruise record. Both remain simplified. Ingenuity uses Mars 2020 target -168; its launch-ascent gap is explicitly recorded, not interpolated. Voyager coverage ends at the last returned sample, not an invented endpoint.

## Photos

| Machine | NASA ID | Title | Credit |
| --- | --- | --- | --- |
| apollo-11 | as11-40-5917 | View of footpad of Apollo 11 Lunar Module as it rested on lunar surface | NASA/JSC |
| apollo-11 | 6900957 | Saturn Apollo Program | NASA/MSFC |
| lunar-rovers | as15-86-11603 | Astronaut James Irwin works at Lunar Roving Vehicle during Apollo 15 EVA | NASA/JSC |
| lunar-rovers | as17-137-20979 | Close-up of lunar roving vehicle at Apollo 17 Taurus-Littrow landing site | NASA/JSC |
| viking-1 | PIA00563 | First Color Image From Viking Lander 1 | NASA/JPL |
| viking-1 | PIA00381 | First Photograph Taken On Mars Surface | NASA/JPL |
| opportunity | PIA15114 | Opportunity Rover Self-Portrait From 2007 | NASA/JPL-Caltech/Cornell |
| opportunity | PIA22218 | Opportunity Rover Views Ground Texture 'Perseverance Valley' | NASA/JPL-Caltech |
| ingenuity | PIA24648 | Mastcam-Z Views Ingenuity After Fifth Flight | NASA/JPL-Caltech/ASU/MSSS |
| ingenuity | PIA24586 | Perseverance's Navcam View of Ingenuity's First Flight | NASA/JPL-Caltech |
| voyager-2 | PIA02246 | Voyager Color Image of Triton | NASA/JPL |
| voyager-2 | PIA21743 | Voyager 2 Encapsulation | NASA/JPL-Caltech/KSC |
| voyager-1 | PIA00452 | Solar System Portrait - Earth as Pale Blue Dot | NASA/JPL |
| voyager-1 | PIA23645 | Pale Blue Dot Revisited | NASA/JPL-Caltech |
| voyager-1 | PIA00451 | Solar System Portrait - 60 Frame Mosaic | NASA/JPL |
| voyager-1 | 101-KSC-77P-229 | KSC-77PP-229 | NASA or National Aeronautics and Space Administration |

No placeholder slots remain. Reviewed all selected images for obvious NASA logos/flags/insignia and rejected illustrated Voyager instrument diagrams. Apollo 11 primary photo uses as11-40-5917 instead of the supplied astronaut portrait to avoid suit insignia; its metadata is preserved. The reflector photo title is generic, but the NASA description explicitly identifies Apollo 11 and the Laser Ranging Retroreflector. First-flight Ingenuity uses PIA24586. Voyager 1 archival title is a catalogue code; NASA description identifies the actual spacecraft. NASA archival titles remain verbatim, not translated.

No Cloud bucket existed, so there was none to delete. Left Behind now has no Cloud storage, functions or auth dependencies.
