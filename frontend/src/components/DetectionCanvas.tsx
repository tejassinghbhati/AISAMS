import { useRef, useEffect, useState } from 'react'
import type { Detection } from '../types'

interface Props {
  imageUrl: string
  detections: Detection[]
  activeCategories: Set<string>
  minConf: number
}

interface Tooltip {
  det: Detection
  x: number
  y: number
}

export default function DetectionCanvas({ imageUrl, detections, activeCategories, minConf }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })

  const visible = detections.filter(
    d => activeCategories.has(d.category) && d.confidence >= minConf,
  )

  useEffect(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    const draw = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const det of visible) {
        const { x, y, w, h } = det.bbox
        const col = det.color

        ctx.globalAlpha = 0.18
        ctx.fillStyle = col
        ctx.fillRect(x, y, w, h)

        ctx.globalAlpha = 1
        ctx.strokeStyle = col
        ctx.lineWidth = Math.max(1.5, img.naturalWidth / 600)
        ctx.strokeRect(x, y, w, h)

        const label = `${det.category} ${(det.confidence * 100).toFixed(0)}%`
        const fontSize = Math.max(10, img.naturalWidth / 80)
        ctx.font = `${fontSize}px sans-serif`
        const tw = ctx.measureText(label).width
        const th = fontSize + 4

        ctx.fillStyle = col
        ctx.fillRect(x, y - th - 2, tw + 8, th + 2)

        ctx.fillStyle = '#fff'
        ctx.fillText(label, x + 4, y - 4)
      }
    }

    if (img.complete) draw()
    else img.onload = draw
  }, [visible, imageUrl])

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = naturalSize.w / rect.width
    const scaleY = naturalSize.h / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    const hit = visible.find(
      d => mx >= d.bbox.x && mx <= d.bbox.x + d.bbox.w && my >= d.bbox.y && my <= d.bbox.y + d.bbox.h,
    )
    setTooltip(hit ? { det: hit, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
  }

  return (
    <div className="relative w-full select-none">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="satellite"
        className="w-full h-auto block rounded-lg"
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-lg"
        onMouseMove={handleMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ imageRendering: 'pixelated' }}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-surface border border-border rounded-lg p-3 shadow-xl text-xs z-10 min-w-[160px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className="font-semibold capitalize text-white mb-1.5" style={{ color: tooltip.det.color }}>
            {tooltip.det.category}
            {tooltip.det.sub_type && <span className="text-muted ml-1">({tooltip.det.sub_type})</span>}
          </div>
          <div className="text-muted space-y-0.5">
            <div>Confidence: <span className="text-white">{(tooltip.det.confidence * 100).toFixed(1)}%</span></div>
            <div>Area: <span className="text-white">{tooltip.det.area_sqm.toLocaleString()} m²</span></div>
            {tooltip.det.centroid.lat && (
              <div>
                Coords:{' '}
                <span className="text-white">
                  {tooltip.det.centroid.lat.toFixed(5)}, {tooltip.det.centroid.lon?.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
