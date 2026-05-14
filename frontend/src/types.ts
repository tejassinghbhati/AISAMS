export interface BBox { x: number; y: number; w: number; h: number }
export interface Centroid { lat: number | null; lon: number | null }

export interface Detection {
  id: string
  category: string
  color: string
  confidence: number
  bbox: BBox
  area_sqm: number
  centroid: Centroid
  geometry: GeoJSONPolygon | GeoJSONPoint | null
  sub_type?: string
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface GeoJSONPoint {
  type: 'Point'
  coordinates: number[]
}

export interface CategorySummary {
  count: number
  total_area_sqm: number
  avg_confidence: number
}

export interface DetectionResult {
  job_id: string
  image_width: number
  image_height: number
  gsd_m: number
  origin: { lat: number; lon: number } | null
  detections: Detection[]
  summary: {
    total: number
    by_category: Record<string, CategorySummary>
  }
  annotated_url: string
}

export interface ChangeItem {
  type: string
  bbox: BBox
  area_px: number
}

export interface ChangeResult {
  job_id: string
  changes: ChangeItem[]
  total_changes: number
  change_summary: Record<string, number>
  overlay_url: string
  comparison_url: string
}
