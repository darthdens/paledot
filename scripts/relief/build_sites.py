# Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
"""Metre-level real terrain heights for each landing site's "near" cap.

1. /tmp/dtm/run.sh (gdalwarp over /vsicurl/) resamples NASA DTMs onto each near tier's lat/lon box, 2048x2048:
   Apollo 11/15/16/17: LROC NAC DTMs (2 m; Apollo 17 5 m), metres above the 1737.4 km sphere.
   Ingenuity (Jezero), Viking 1: HiRISE DTMs (~1 m), metres above the Mars 2000 areoid.
   Opportunity: no HiRISE DTM covers the final site, so MOLA global heights only.
2. This script fills any gap with the global map (build_globals.py inputs), blends the outer 8% into the
   global heights so the cap meets the surrounding ground, and writes <site>-height.webp:
   (decimetres above baseM + 32768) split into R (high) / G (low), north up. index.json gets heightFile/heightBaseM.
"""
import json, os, numpy as np
from PIL import Image
from scipy.io import netcdf_file
from scipy.ndimage import map_coordinates
Image.MAX_IMAGE_PIXELS = None
T = 'public/left-behind/terrain'
idx = json.load(open(f'{T}/index.json'))
moon = np.array(Image.open('/tmp/dem/moon.tif'), dtype=np.float64) * 1000.0
mars = np.roll(np.fromfile('/tmp/dem/mars.img', '>i2').reshape(2880, 5760).astype(np.float64), 2880, axis=1)
N = 2048
def glob(body, lat, lon):
    g = moon if body == 'moon' else mars
    h, w = g.shape
    x = ((lon + 180) % 360) / 360 * w - 0.5; y = (90 - lat) / 180 * h - 0.5
    return map_coordinates(g, [y, x], order=1, mode='wrap')
for site in idx['sites']:
    t = next(t for t in site['tiers'] if t['tier'] == 'near'); sid = site.get('id') or site.get('site')
    lats = np.linspace(t['north'], t['south'], N); lons = np.linspace(t['west'], t['east'], N)
    LON, LAT = np.meshgrid(lons, lats)
    g = glob(site['body'], LAT, LON)
    src = 'MOLA global (no HiRISE DTM covers this site)'
    h = g.copy()
    if os.path.exists(f'/tmp/dtm/{sid}.tif'):
        d = np.array(Image.open(f'/tmp/dtm/{sid}.tif'), dtype=np.float64)
        ok = (d > -9000) & np.isfinite(d)
        if ok.mean() > 0.05:
            # Align DTM datum to the global map over valid pixels (removes small datum offsets), then fill gaps.
            off = np.median((g - d)[ok]); d = d + off
            h = np.where(ok, d, g)
            src = f"{'LROC NAC' if site['body']=='moon' else 'HiRISE'} DTM ({ok.mean()*100:.0f}% coverage, datum shift {off:.1f} m)"
    yy, xx = np.mgrid[0:N, 0:N] / (N - 1)
    edge = np.minimum(np.minimum(xx, 1 - xx), np.minimum(yy, 1 - yy))
    wgt = np.clip(edge / 0.08, 0, 1); wgt = wgt * wgt * (3 - 2 * wgt)
    h = g + (h - g) * wgt
    base = float(np.round(h.mean()))
    v = (np.round((h - base) * 10).astype(np.int32) + 32768).clip(0, 65535).astype(np.uint16)
    Image.fromarray(np.stack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.zeros_like(v, np.uint8)], -1), 'RGB') \
        .save(f'{T}/{sid}-height.webp', lossless=True, method=6)
    t['heightFile'] = f'{sid}-height.webp'; t['heightBaseM'] = base; t['heightScaleM'] = 0.1; t['heightSource'] = src
    print(sid, src, 'relief', round(h.max() - h.min()), 'm', os.path.getsize(f'{T}/{sid}-height.webp') // 1024, 'KB')
json.dump(idx, open(f'{T}/index.json', 'w'), indent=1)
