import type { DetectionResult, ChangeResult, DigitPushResult } from '../types'

const BASE = '/api'

export async function detectAssets(
  file: File,
  gsd_m: number,
  lat?: number,
  lon?: number,
): Promise<DetectionResult> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('gsd_m', String(gsd_m))
  if (lat !== undefined) fd.append('lat', String(lat))
  if (lon !== undefined) fd.append('lon', String(lon))
  const res = await fetch(`${BASE}/detect`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function detectChanges(
  before: File,
  after: File,
  gsd_m: number,
): Promise<ChangeResult> {
  const fd = new FormData()
  fd.append('before', before)
  fd.append('after', after)
  fd.append('gsd_m', String(gsd_m))
  const res = await fetch(`${BASE}/change`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const exportUrl = (jobId: string, fmt: 'geojson' | 'csv' | 'shapefile') =>
  `${BASE}/export/${jobId}/${fmt}`

export async function fetchSatellite(
  lat: number,
  lon: number,
  zoom: number,
  source: string,
): Promise<DetectionResult> {
  const fd = new FormData()
  fd.append('lat', String(lat))
  fd.append('lon', String(lon))
  fd.append('zoom', String(zoom))
  fd.append('source', source)
  const res = await fetch(`${BASE}/satellite/fetch`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function digitPush(jobId: string): Promise<DigitPushResult> {
  const res = await fetch(`${BASE}/digit/push/${jobId}`, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
