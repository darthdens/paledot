# Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
"""Global elevation maps for Earth, Moon and Mars (real NASA/NOAA data, true heights in metres).

Sources (download into /tmp/dem first):
  moon.tif   NASA SVS CGI Moon Kit LDEM_16 (LRO LOLA), float km above 1737.4 km sphere
             https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif
  mars.img   MGS MOLA MEGDR megt90n000eb (16 px/deg), big-endian int16 m above areoid, lon 0..360E
             https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg016/megt90n000eb.img
  earth.nc   NOAA ETOPO1 (ice surface) via ERDDAP, every 5th arc-minute, metres above sea level
             https://coastwatch.pfeg.noaa.gov/erddap/griddap/etopo180.nc?altitude[(-90):5:(90)][(-180):5:(180)]
Output: equirectangular, north up, lon -180..180 left to right; height+32768 split into R (high byte) and
G (low byte) of a lossless WebP. relief.json lists sizes and credits.
"""
import json, numpy as np
from PIL import Image
from scipy.io import netcdf_file
Image.MAX_IMAGE_PIXELS = None
D, OUT = '/tmp/dem', 'public/textures/relief'

def save(name, metres):
    v = (np.round(metres).astype(np.int32) + 32768).clip(0, 65535).astype(np.uint16)
    rgb = np.stack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.zeros_like(v, np.uint8)], -1)
    Image.fromarray(rgb, 'RGB').save(f'{OUT}/{name}-height.webp', lossless=True, quality=100, method=6)
    return {'width': int(v.shape[1]), 'height': int(v.shape[0]), 'minM': int(metres.min()), 'maxM': int(metres.max())}

meta = {}
moon = np.array(Image.open(f'{D}/moon.tif'), dtype=np.float64) * 1000.0
meta['moon'] = {**save('moon', moon), 'datum': 'sphere 1737.4 km', 'credit': 'NASA/GSFC/LOLA (LRO), NASA SVS CGI Moon Kit LDEM_16', 'sourceUrl': 'https://svs.gsfc.nasa.gov/4720'}
mars = np.roll(np.fromfile(f'{D}/mars.img', '>i2').reshape(2880, 5760).astype(np.float64), 2880, axis=1)
meta['mars'] = {**save('mars', mars), 'datum': 'MOLA areoid', 'credit': 'NASA/JPL/GSFC MOLA (Mars Global Surveyor) MEGDR 16 px/deg', 'sourceUrl': 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html'}
nc = netcdf_file(f'{D}/earth.nc', mmap=False)
earth = nc.variables['altitude'].data.astype(np.float64)[::-1, :-1]  # north up, drop duplicate 180° column
meta['earth'] = {**save('earth', earth), 'datum': 'sea level', 'credit': 'NOAA NCEI ETOPO1 Global Relief Model (ice surface)', 'sourceUrl': 'https://www.ncei.noaa.gov/products/etopo-global-relief-model'}
json.dump(meta, open(f'{OUT}/relief.json', 'w'), indent=1)
print(meta)
