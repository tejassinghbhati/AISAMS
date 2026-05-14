import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, MapPin, Ruler, Loader2 } from 'lucide-react'
import { detectAssets } from '../api/client'

export default function UploadPage() {
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gsd, setGsd] = useState(0.5)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')

  const pick = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pick(f)
  }, [])

  const submit = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const result = await detectAssets(
        file,
        gsd,
        lat ? parseFloat(lat) : undefined,
        lon ? parseFloat(lon) : undefined,
      )
      sessionStorage.setItem('detectionResult', JSON.stringify(result))
      sessionStorage.setItem('previewUrl', preview ?? '')
      nav('/results')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Detection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl px-4 py-12">
      {/* Hero text */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Spatial Asset Detection
        </h1>
        <p className="text-muted text-sm leading-relaxed max-w-lg mx-auto">
          Upload a satellite, aerial, or drone image. The system automatically
          detects and classifies urban assets — buildings, trees, water bodies,
          roads, drains and more.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[220px] flex items-center justify-center ${
          dragging
            ? 'border-blue-400 bg-blue-500/10'
            : file
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-border hover:border-blue-500/50 hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.tif,.tiff"
          className="hidden"
          onChange={e => e.target.files?.[0] && pick(e.target.files[0])}
        />
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-auto max-h-72 object-contain" />
            <div className="absolute inset-0 bg-gradient-to-t from-canvas/80 to-transparent flex items-end p-4">
              <span className="text-sm text-white font-medium">{file?.name}</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center p-8">
            <UploadCloud size={40} className="text-blue-400 opacity-80" />
            <div>
              <p className="text-white font-medium">Drop satellite image here</p>
              <p className="text-muted text-sm mt-1">or click to browse · JPG, PNG, TIFF</p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted flex items-center gap-1">
            <Ruler size={11} /> GSD (m/px)
          </span>
          <input
            type="number"
            value={gsd}
            onChange={e => setGsd(parseFloat(e.target.value))}
            step={0.1}
            min={0.01}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted flex items-center gap-1">
            <MapPin size={11} /> Latitude
          </span>
          <input
            type="number"
            value={lat}
            onChange={e => setLat(e.target.value)}
            placeholder="e.g. 28.6139"
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-muted/40 focus:outline-none focus:border-blue-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted flex items-center gap-1">
            <MapPin size={11} /> Longitude
          </span>
          <input
            type="number"
            value={lon}
            onChange={e => setLon(e.target.value)}
            placeholder="e.g. 77.2090"
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-muted/40 focus:outline-none focus:border-blue-500"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!file || loading}
        className="mt-5 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Detecting Assets…
          </>
        ) : (
          'Run Detection'
        )}
      </button>

      <p className="text-center text-xs text-muted mt-4">
        YOLOv8 + Spectral Segmentation · Detects 7 asset classes
      </p>
    </div>
  )
}
