# Real NASA surface detail for Earth, Moon and Mars

## What you'll see
- **From far away:** Earth, the Moon and Mars wrapped in much sharper NASA global maps. The current Moon map is only 1024 px wide, Mars 2048 px and Earth 2048 px.
- **Up close at each landing site:** a sharp patch of real NASA orbital imagery around Apollo 11, the three rover sites, Viking 1, Opportunity and Ingenuity. You can zoom from orbit right down to the machine without the ground turning into blur.
- **Loading:** the opening loader stays exactly as fast as now. The sharper maps load quietly afterwards and swap in.

## Sources (real NASA data only, credited in the app's credits file)
- **Moon (global):** LRO Wide Angle Camera global mosaic, about 100 m per pixel (NASA/GSFC/ASU, via NASA Moon Trek).
- **Moon (sites):** the sharpest LRO mosaic NASA Trek serves at each Apollo site.
- **Mars (global):** Viking MDIM 2.1 colour mosaic, about 232 m per pixel (NASA/USGS, via NASA Mars Trek).
- **Mars (sites):** MRO CTX mosaic, about 5 m per pixel (NASA/JPL/MSSS, via Mars Trek). HiRISE where Trek serves it.
- **Earth (global):** NASA Blue Marble, via NASA GIBS.
- Every image is downloaded once now and stored with the app, so visitors' browsers never call NASA.

## How sharp
- **Global maps:** 8192 x 4096 on computers. Phones that can't hold that get 4096 x 2048, which is still 2 to 4 times sharper than today.
- **Site patches:** roughly 30 to 70 km across, at the best resolution each source offers. The exact metres per pixel for each site will be listed in the credits.

## Limits I'll be honest about
- This is flat imagery. Real terrain height (crater walls, hills) would be a later step.
- Metre-scale detail on the Moon only exists where NASA has published it. Elsewhere the source's own resolution is the ceiling, and I won't sharpen it artificially.

## Technical details
- A one-off script fetches the Trek and GIBS tiles and stitches them into static JPEGs: global maps in `public/textures/hd/`, and site patches plus a `terrain/index.json` (bounds, source, metres per pixel) in `public/left-behind/terrain/`.
- TexturedPlanet keeps the bundled low-res maps for boot, then swaps in the HD map once the scene is ready. The size is chosen from the device's maximum texture size, mipmaps and anisotropy are on, and the shader is unchanged.
- SitePatch uses the site texture with UVs mapped from the bounds stored in `terrain/index.json`, lit by the body's sun direction. It falls back to the global map if a patch is missing.
- Moon/Mars/Earth texture longitude offsets get checked against known sites, so pins line up with the imagery.
- CREDITS.md and AGENTS.md get updated, and a test checks every site has a patch whose bounds contain its pin.
