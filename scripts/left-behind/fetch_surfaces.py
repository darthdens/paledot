# Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
"""One-off fetch of NASA surface imagery, stored as static files (the browser never calls NASA).

Global maps:  Moon LRO WAC 303ppd and Mars Viking MDIM 2.1 colour mosaic (NASA Moon/Mars Trek WMTS).
Site patches: LRO NAC Apollo 60x60 km mosaics, MRO HiRISE Jezero, MRO CTX Meridiani and the CTX global
              mosaic (Viking 1), composited over the global mosaic where a site layer has no data.
Run:  python3 scripts/left-behind/fetch_surfaces.py [globals|sites]
"""
import io, json, math, sys
from concurrent.futures import ThreadPoolExecutor
import requests
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
S = requests.Session()
TREK = "https://trek.nasa.gov/tiles/{body}/EQ/{layer}/1.0.0/default/default028mm/{z}/{r}/{c}.{ext}"
LAYERS = {
  "wac":  dict(url=TREK, body="Moon", layer="LRO_WAC_Mosaic_Global_303ppd_v02", ext="jpg", tile=256, max=8,
               name="LRO Wide Angle Camera global mosaic (303 ppd)", credit="NASA/GSFC/Arizona State University, via NASA Moon Trek"),
  "mdim": dict(url=TREK, body="Mars", layer="Mars_Viking_MDIM21_ClrMosaic_global_232m", ext="jpg", tile=256, max=7,
               name="Viking MDIM 2.1 colour mosaic (232 m)", credit="NASA/JPL/USGS, via NASA Mars Trek"),
  "ctxg": dict(url="https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/{z}/{r}/{c}", tile=512, max=12,
               name="MRO CTX global mosaic (beta01, ~5 m)", credit="NASA/JPL/MSSS, Caltech Murray Lab, via NASA Mars Trek"),
  "a11":  dict(url=TREK, body="Moon", layer="A11_60x60km.eq", ext="png", tile=256, max=15, name="LRO NAC mosaic, Apollo 11 (60x60 km)", credit="NASA/GSFC/Arizona State University, via NASA Moon Trek"),
  "a15":  dict(url=TREK, body="Moon", layer="A15_60x60km.0_2.eq", ext="png", tile=256, max=15, name="LRO NAC mosaic, Apollo 15 (60x60 km)", credit="NASA/GSFC/Arizona State University, via NASA Moon Trek"),
  "a16":  dict(url=TREK, body="Moon", layer="A16_60x60km.eq", ext="png", tile=256, max=15, name="LRO NAC mosaic, Apollo 16 (60x60 km)", credit="NASA/GSFC/Arizona State University, via NASA Moon Trek"),
  "a17":  dict(url=TREK, body="Moon", layer="A17_60x60km.eq", ext="png", tile=256, max=15, name="LRO NAC mosaic, Apollo 17 (60x60 km)", credit="NASA/GSFC/Arizona State University, via NASA Moon Trek"),
  "jez":  dict(url=TREK, body="Mars", layer="JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd", ext="png", tile=256, max=17,
               name="MRO HiRISE Jezero controlled mosaic (25 cm)", credit="NASA/JPL-Caltech/University of Arizona, via NASA Mars Trek"),
  "mer":  dict(url=TREK, body="Mars", layer="S_Meridiani_Sinus_Planium_CTX_BlockAdj_dd", ext="png", tile=256, max=12,
               name="MRO CTX Meridiani Planum mosaic", credit="NASA/JPL/MSSS, via NASA Mars Trek"),
}
RADIUS_KM = {"moon": 1737.4, "mars": 3389.5}

def get_tile(key, z, r, c):
  L = LAYERS[key]
  n = 2 ** z
  c %= 2 * n
  if r < 0 or r >= n: return None
  url = L["url"].format(body=L.get("body"), layer=L.get("layer"), ext=L.get("ext"), z=z, r=r, c=c)
  for _ in range(3):
    try:
      x = S.get(url, timeout=30)
      if x.status_code == 404: return None
      if x.ok:
        try: return Image.open(io.BytesIO(x.content)).convert("RGBA")
        except Exception: return None
    except requests.RequestException: pass
  return None

def region(key, z, west, south, east, north):
  """Stitch tiles of level z and crop exactly to the lon/lat box (degrees). Returns RGBA, deg/px."""
  L = LAYERS[key]; ts = L["tile"]; deg = 180 / 2 ** z; dpp = deg / ts
  c0, c1 = math.floor((west + 180) / deg), math.floor((east + 180) / deg)
  r0, r1 = math.floor((90 - north) / deg), math.floor((90 - south) / deg)
  canvas = Image.new("RGBA", ((c1 - c0 + 1) * ts, (r1 - r0 + 1) * ts), (0, 0, 0, 0))
  jobs = [(r, c) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)]
  with ThreadPoolExecutor(16) as ex:
    for (r, c), im in zip(jobs, ex.map(lambda rc: get_tile(key, z, *rc), jobs)):
      if im is not None:
        if im.size != (ts, ts): im = im.resize((ts, ts))
        canvas.paste(im, ((c - c0) * ts, (r - r0) * ts))
  ox, oy = c0 * deg - 180, 90 - r0 * deg
  box = ((west - ox) / dpp, (oy - north) / dpp, (east - ox) / dpp, (oy - south) / dpp)
  return canvas.crop(tuple(round(v) for v in box)), dpp

def level_for(key, dpp_target):
  L = LAYERS[key]
  z = math.ceil(math.log2(180 / (L["tile"] * dpp_target)))
  return max(0, min(L["max"], z))

GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{layer}/default/{time}/500m/{z}/{r}/{c}.{ext}"

def gibs_global(layer, time, ext, z=4):
  """NASA GIBS EPSG:4326 500m matrix: 512 px tiles, level 4 = 20x10 tiles of 18 degrees."""
  cols, rows = 20, 10
  canvas = Image.new("RGB", (cols * 512, rows * 512))
  def one(rc):
    r, c = rc
    for _ in range(3):
      try:
        x = S.get(GIBS.format(layer=layer, time=time, ext=ext, z=z, r=r, c=c), timeout=60)
        if x.ok: return Image.open(io.BytesIO(x.content)).convert("RGB")
      except Exception: pass
    raise RuntimeError(f"GIBS tile {layer} {r}/{c} failed")
  jobs = [(r, c) for r in range(rows) for c in range(cols)]
  with ThreadPoolExecutor(12) as ex:
    for (r, c), im in zip(jobs, ex.map(one, jobs)): canvas.paste(im, (c * 512, r * 512))
  return canvas

def globals_():
  for layer, time, ext, out in (("BlueMarble_NextGeneration", "default", "jpeg", "earth-day"), ("VIIRS_Black_Marble", "2016-01-01", "png", "earth-night")):
    if out in sys.argv[2:] or not sys.argv[2:]:
      im = gibs_global(layer, time, ext)
      for w in (8192, 4096):
        im.resize((w, w // 2), Image.LANCZOS).save(f"public/textures/hd/{out}-{w}.webp", quality=85, method=6)
      print("global", out, im.size)
  for key, out in (("wac", "moon"), ("mdim", "mars")):
    if sys.argv[2:] and out not in sys.argv[2:]: continue
    im, _ = region(key, 4, -180, -90, 180, 90)
    im = im.convert("RGB")
    for w in (8192, 4096):
      im.resize((w, w // 2), Image.LANCZOS).save(f"public/textures/hd/{out}-{w}.webp", quality=85, method=6)
    print("global", out, im.size)

SITES = [
  # id, body, lat, lon (east, -180..180), site layer, nearKm, nearPx, midKm, midPx
  ("apollo-11", "moon", 0.67416, 23.47314, "a11", 3.0, 4096, 40.0, 2048, "wac"),
  ("apollo-15", "moon", 26.13174, 3.63803, "a15", 3.0, 4096, 40.0, 2048, "wac"),
  ("apollo-16", "moon", -8.9729, 15.5037, "a16", 3.0, 4096, 40.0, 2048, "wac"),
  ("apollo-17", "moon", 20.1896, 30.7769, "a17", 3.0, 4096, 40.0, 2048, "wac"),
  ("viking-1", "mars", 22.27, 312.05 - 360, "ctxg", 8.0, 4096, 60.0, 2048, "mdim"),
  ("opportunity", "mars", -1.9462, 354.4734 - 360, "ctxg", 8.0, 4096, 60.0, 2048, "mdim", "mer"),
  ("ingenuity", "mars", 18.4447, 77.4508, "jez", 2.0, 4096, 40.0, 2048, "mdim", "ctxg"),
]

def patch(site, tier, lat, lon, layer, km, px, base, body):
  kpd = RADIUS_KM[body] * math.pi / 180
  half_lat = km / 2 / kpd; half_lon = half_lat / max(math.cos(math.radians(lat)), 0.05)
  w, s, e, n = lon - half_lon, lat - half_lat, lon + half_lon, lat + half_lat
  dpp_target = (2 * half_lat) / px
  z = level_for(layer, dpp_target)
  img, dpp = region(layer, z, w, s, e, n)
  img = img.resize((px, px), Image.LANCZOS)
  # Underlay: global mosaic where the site layer has no data (transparent).
  zb = level_for(base, dpp_target); under, _ = region(base, zb, w, s, e, n)
  under = under.resize((px, px), Image.LANCZOS).convert("RGBA")
  # Fill gaps first from the same layer at coarser levels, then from the global mosaic.
  for dz in (2, 4):
    if z - dz < 0: break
    coarse, _ = region(layer, z - dz, w, s, e, n)
    coarse = coarse.resize((px, px), Image.LANCZOS)
    under = Image.composite(coarse, under, coarse.getchannel("A").point(lambda v: 255 if v > 250 else 0))
  a = img.getchannel("A"); coverage = sum(1 for v in a.resize((64, 64)).get_flattened_data() if v > 200) / 4096
  out = Image.composite(img, under, a.point(lambda v: 255 if v > 250 else 0)).convert("L")
  fn = f"{site}-{tier}.webp"; out.save(f"public/left-behind/terrain/{fn}", quality=85, method=6)
  mpp = dpp * kpd * 1000
  L = LAYERS[layer]
  return {"file": fn, "tier": tier, "west": w, "south": s, "east": e, "north": n, "px": px,
          "sourceMetresPerPixel": round(mpp, 2), "shownMetresPerPixel": round(km * 1000 / px, 2), "coverage": round(coverage, 3),
          "source": L["name"], "credit": L["credit"], "trekLayer": L.get("layer") or "CTX_beta01_uncontrolled_5m_Caltech",
          "fallback": LAYERS[base]["name"]}

def sites():
  idx = {"generated": "2026-11-14", "note": "Greyscale luminance; the app colours it with the global map. Bounds in degrees, longitude east -180..180.", "sites": []}
  only = sys.argv[2:] 
  try: old = {x["id"]: x for x in json.load(open("public/left-behind/terrain/index.json"))["sites"]}
  except Exception: old = {}
  for site, body, lat, lon, layer, nkm, npx, mkm, mpx, base, *mid in SITES:
    if only and site not in only and site in old: idx["sites"].append(old[site]); continue
    tiers = [patch(site, "near", lat, lon, layer, nkm, npx, base, body), patch(site, "mid", lat, lon, mid[0] if mid else layer, mkm, mpx, base, body)]
    idx["sites"].append({"id": site, "body": body, "lat": lat, "lon": lon, "tiers": tiers})
    print(site, [(t["tier"], t["sourceMetresPerPixel"], t["coverage"]) for t in tiers])
  json.dump(idx, open("public/left-behind/terrain/index.json", "w"), indent=1)

if __name__ == "__main__":
  arg = sys.argv[1] if len(sys.argv) > 1 else "sites"
  globals_() if arg == "globals" else sites()
