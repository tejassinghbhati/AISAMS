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
