"""
geo.py — Export utilities for detection results.

Converts a job dict (produced by detector.py or change.py) into standard
geospatial formats for downstream GIS tools and DIGIT integration.

Functions
---------
build_geojson(job)  →  RFC 7946 FeatureCollection dict
build_csv(job)      →  CSV string (id, category, confidence, area, centroid)

The job dict is expected to have a "detections" key whose items each contain:
  - id, category, confidence, area_sqm
  - geometry  : GeoJSON Polygon (present when lat/lon were supplied at detect time)
  - centroid  : {"lat": float, "lon": float}  (always present, may be None)

If geometry is absent but centroid coordinates exist, a Point geometry is used
so the feature still appears on a GIS map.
"""


def build_geojson(job: dict) -> dict:
    features = []
    for det in job.get("detections", []):
        geom = det.get("geometry")
        c = det.get("centroid", {})
        if geom is None and c.get("lat"):
            geom = {"type": "Point", "coordinates": [c["lon"], c["lat"]]}
        if geom is None:
            continue
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "id": det["id"],
                "category": det["category"],
                "confidence": det["confidence"],
                "area_sqm": det.get("area_sqm"),
            },
        })
    return {"type": "FeatureCollection", "features": features}


def build_csv(job: dict) -> str:
    lines = ["id,category,confidence,area_sqm,centroid_lat,centroid_lon"]
    for det in job.get("detections", []):
        c = det.get("centroid", {})
        lines.append(
            f"{det['id']},{det['category']},{det['confidence']:.3f},"
            f"{det.get('area_sqm', 0):.1f},"
            f"{c.get('lat') or ''},{c.get('lon') or ''}"
        )
    return "\n".join(lines)
