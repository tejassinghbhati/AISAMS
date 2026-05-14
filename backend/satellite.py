"""
Fetch satellite imagery from ESRI World Imagery (global, no auth)
or Bhuvan ISRO WMS (India-specific, NRSC/ISRO).
"""

import io
import math
import urllib.request
from PIL import Image

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.arcgis.com/",
}

_ESRI_TILE = (
    "https://server.arcgisonline.com/ArcGIS/rest/services"
    "/World_Imagery/MapServer/tile/{z}/{y}/{x}"
)

_BHUVAN_WMS = (
    "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms"
    "?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1"
    "&LAYERS=india3&STYLES=&FORMAT=image/jpeg"
    "&SRS=EPSG:4326&WIDTH={w}&HEIGHT={h}"
    "&BBOX={minx},{miny},{maxx},{maxy}"
)

# Approximate GSD (m/px at equator) per zoom level for a 900×900 output
GSD_BY_ZOOM: dict[int, float] = {16: 1.20, 17: 0.60, 18: 0.30, 19: 0.15}


def _lat_lon_to_tile(lat: float, lon: float, z: int) -> tuple[int, int]:
    lat_r = math.radians(lat)
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.log(math.tan(lat_r) + 1 / math.cos(lat_r)) / math.pi) / 2 * n)
    return x, y


def _tile_nw_corner(x: int, y: int, z: int) -> tuple[float, float]:
    """Return (lat, lon) of the NW corner of tile (x, y) at zoom z."""
    n = 2 ** z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lon


def _fetch_esri(lat: float, lon: float, zoom: int, grid: int) -> Image.Image:
    cx, cy = _lat_lon_to_tile(lat, lon, zoom)
    half = grid // 2
    canvas = Image.new("RGB", (256 * grid, 256 * grid))
    for dy in range(grid):
        for dx in range(grid):
            tx, ty = cx + dx - half, cy + dy - half
            try:
                url = _ESRI_TILE.format(z=zoom, x=tx, y=ty)
                req = urllib.request.Request(url, headers=_HEADERS)
                with urllib.request.urlopen(req, timeout=15) as r:
                    tile = Image.open(io.BytesIO(r.read())).convert("RGB")
                canvas.paste(tile, (dx * 256, dy * 256))
            except Exception as exc:
                print(f"[satellite] ESRI tile {zoom}/{ty}/{tx} failed: {exc}")
    return canvas.resize((900, 900), Image.LANCZOS)


def _fetch_bhuvan(lat: float, lon: float, zoom: int, grid: int) -> Image.Image:
    cx, cy = _lat_lon_to_tile(lat, lon, zoom)
    half = grid // 2
    lat_n, lon_w = _tile_nw_corner(cx - half,     cy - half,     zoom)
    lat_s, lon_e = _tile_nw_corner(cx + half + 1, cy + half + 1, zoom)
    size = 256 * grid
    url = _BHUVAN_WMS.format(minx=lon_w, miny=lat_s, maxx=lon_e, maxy=lat_n,
                              w=size, h=size)
    req = urllib.request.Request(url, headers={"User-Agent": _HEADERS["User-Agent"]})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = r.read()
    return Image.open(io.BytesIO(data)).convert("RGB").resize((900, 900), Image.LANCZOS)


def fetch_satellite_image(
    lat: float,
    lon: float,
    zoom: int = 18,
    grid: int = 3,
    source: str = "esri",
) -> tuple[Image.Image, float]:
    """
    Return (PIL Image, gsd_m) for the area centred at (lat, lon).
    Falls back from Bhuvan to ESRI on any network error.
    """
    gsd = GSD_BY_ZOOM.get(zoom, 0.5)
    if source == "bhuvan":
        try:
            return _fetch_bhuvan(lat, lon, zoom, grid), gsd
        except Exception as exc:
            print(f"[satellite] Bhuvan failed ({exc}), falling back to ESRI")
    return _fetch_esri(lat, lon, zoom, grid), gsd
