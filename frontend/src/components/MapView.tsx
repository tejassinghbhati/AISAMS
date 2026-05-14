import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from 'react-leaflet'
import type { Detection } from '../types'
import { useEffect } from 'react'
import L from 'leaflet'

interface Props {
  detections: Detection[]
  origin: { lat: number; lon: number } | null
  activeCategories: Set<string>
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, 16) }, [center])
  return null
}

export default function MapView({ detections, origin, activeCategories }: Props) {
  const center: [number, number] = origin
    ? [origin.lat, origin.lon]
    : [20.5937, 78.9629] // India centre

  const geoFeatures = detections
    .filter(d => d.geometry && activeCategories.has(d.category))
    .map(d => ({
      type: 'Feature' as const,
      geometry: d.geometry!,
      properties: {
        id: d.id,
        category: d.category,
        confidence: d.confidence,
        area_sqm: d.area_sqm,
        color: d.color,
      },
    }))

  const geoJson = { type: 'FeatureCollection' as const, features: geoFeatures }

  const styleFeature = (feature: GeoJSON.Feature | undefined) => ({
    color: feature?.properties?.color ?? '#888',
    weight: 2,
    fillOpacity: 0.25,
    fillColor: feature?.properties?.color ?? '#888',
  })

  return (
    <MapContainer
      center={center}
      zoom={origin ? 15 : 5}
      className="w-full h-full rounded-lg"
      zoomControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {origin && <FlyTo center={[origin.lat, origin.lon]} />}
      {geoFeatures.length > 0 && (
        <GeoJSON
          key={JSON.stringify(activeCategories)}
          data={geoJson as GeoJSON.FeatureCollection}
          style={styleFeature}
          onEachFeature={(feature, layer) => {
            const p = feature.properties
            layer.bindPopup(`
              <div style="min-width:140px">
                <b style="color:${p.color};text-transform:capitalize">${p.category}</b><br/>
                Confidence: ${(p.confidence * 100).toFixed(1)}%<br/>
                Area: ${p.area_sqm?.toLocaleString()} m²
              </div>
            `)
          }}
        />
      )}
    </MapContainer>
  )
}
