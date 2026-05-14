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

export interface EvalMetrics {
  gt_count: number
  pred_count: number
  tp: number
  precision: number
  recall: number
  f1: number
}

export interface EvalSummary {
  available: boolean
  tiles?: number
  avg_precision?: number
  avg_recall?: number
  avg_f1?: number
  per_tile?: Array<{ tile: string } & EvalMetrics>
}

export interface ClassStat {
  class_id: number
  class_name: string
  hex: string
  area_pct: number
  pixel_count: number
}

export interface SegResult {
  job_id: string
  seg_url: string
  overlay_url: string
  class_stats: ClassStat[]
  class_mask_b64: string
  seg_size: number
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
