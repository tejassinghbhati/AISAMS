import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, MapPin, Ruler, Loader2, ArrowRight, Zap, Satellite } from 'lucide-react'
import { detectAssets, fetchSatellite } from '../api/client'
import type { DetectionResult } from '../types'

interface SampleMeta {
  file: string; label: string; desc: string
  lat: number; lon: number; gsd: number; url: string; available: boolean
  source?: string; gt_buildings?: number
}

export default function UploadPage() {
  const nav = useNavigate()
  const inputRef  = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLDivElement>(null)

  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDrag]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [gsd, setGsd]         = useState(0.5)
  const [lat, setLat]         = useState('')
  const [lon, setLon]         = useState('')
  const [samples, setSamples] = useState<SampleMeta[]>([])
  const [sampleLoading, setSampleLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/samples')
      .then(r => r.json())
      .then(d => setSamples(d.samples ?? []))
      .catch(() => {})
  }, [])

  const pick = (f: File) => {
    setFile(f); setPreview(URL.createObjectURL(f)); setError('')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) pick(f)
  }, [])

  const submit = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const result = await detectAssets(file, gsd,
        lat ? parseFloat(lat) : undefined,
        lon ? parseFloat(lon) : undefined,
      )
      storeAndNav(result, preview ?? '')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Detection failed')
    } finally { setLoading(false) }
  }

  const runSample = async (s: SampleMeta) => {
    setSampleLoading(s.file)
    try {
      const res = await fetch(`/api/samples/${s.file}/detect`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const result: DetectionResult = await res.json()
      storeAndNav(result, s.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sample detection failed')
    } finally { setSampleLoading(null) }
  }

  const storeAndNav = (result: DetectionResult, imgUrl: string) => {
    sessionStorage.setItem('detectionResult', JSON.stringify(result))
    sessionStorage.setItem('previewUrl', imgUrl)
    nav('/results')
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-5 py-12">

      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 bg-accent inline-block"/>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-tx3">Asset Detection</span>
          <div className="flex-1 h-px bg-border mx-2"/>
          <span className="font-mono text-[9px] text-tx3">YOLOv8-seg + Spectral</span>
        </div>
        <h1 className="text-2xl font-bold text-tx mb-2">Detect Spatial Assets</h1>
        <p className="text-tx2 text-sm max-w-xl leading-relaxed">
          Upload a satellite, aerial or drone image to detect and classify buildings,
          roads, water bodies, vegetation and more, with GeoJSON export.
        </p>
      </div>

      {/* ── Sample gallery ── */}
      {samples.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">Sample Imagery</span>
            <div className="flex-1 h-px bg-border"/>
            <span className="font-mono text-[9px] text-tx3">SpaceNet SN4 · WorldView-2</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-border">
            {samples.map(s => (
              <SampleCard key={s.file} sample={s} loading={sampleLoading === s.file} onRun={() => runSample(s)}/>
            ))}
          </div>
        </div>
      )}

      {/* ── Upload section ── */}
      <div ref={uploadRef}>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">Image Input</span>
          <div className="flex-1 h-px bg-border"/>
          <span className="font-mono text-[9px] text-tx3">JPG · PNG · TIFF</span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="relative border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[220px] flex items-center justify-center"
          style={{
            borderColor: dragging ? '#388bfd' : file ? '#3fb950' : '#30363d',
            background:  dragging ? 'rgba(56,139,253,0.04)' : file ? 'rgba(63,185,80,0.04)' : '#0d1117',
          }}
        >
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff" className="hidden"
            onChange={e => e.target.files?.[0] && pick(e.target.files[0])}/>
          {preview ? (
            <>
              <img src={preview} alt="preview" className="w-full h-auto max-h-80 object-contain"/>
              <div className="absolute inset-x-0 bottom-0 border-t border-border bg-panel/90 px-4 py-2 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block"/>
                <span className="font-mono text-[10px] text-tx2 truncate">{file?.name}</span>
                <span className="font-mono text-[10px] text-tx3 ml-auto">
                  {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center p-10">
              <div className="border border-border2 p-4">
                <UploadCloud size={24} style={{ color: '#388bfd' }}/>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-tx">Drop satellite image here</p>
                <p className="font-mono text-[9px] text-tx3 mt-1 uppercase tracking-widest">or click to browse</p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata row */}
        <div className="mt-px grid grid-cols-3 gap-px bg-border">
          {[
            { label: 'GSD M/PX', icon: <Ruler size={10}/>, val: gsd.toString(), set: (v: string) => setGsd(parseFloat(v)), type: 'number', ph: '' },
            { label: 'LATITUDE',  icon: <MapPin size={10}/>, val: lat, set: setLat, type: 'number', ph: '28.6139' },
            { label: 'LONGITUDE', icon: <MapPin size={10}/>, val: lon, set: setLon, type: 'number', ph: '77.2090' },
          ].map(f => (
            <div key={f.label} className="bg-panel px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-tx3">{f.icon}</span>
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-tx3">{f.label}</span>
              </div>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                className="w-full bg-transparent font-mono text-sm text-tx focus:outline-none placeholder:text-tx3"
                style={{ appearance: 'textfield' } as React.CSSProperties}/>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-px border border-[#f85149]/40 bg-[#f85149]/08 px-4 py-2.5">
            <span className="font-mono text-[10px] text-[#f85149]">{error}</span>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!file || loading}
          className="mt-px w-full py-3.5 bg-accent font-mono text-[11px] uppercase tracking-[0.2em] font-semibold text-[#07080b] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
          {loading
            ? <><Loader2 size={14} className="animate-spin"/>Detecting Assets…</>
            : <>Run Detection <ArrowRight size={13}/></>}
        </button>

        <div className="mt-3 text-center">
          <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">
            First run auto-downloads YOLOv8n (~6 MB) · CPU inference
          </span>
        </div>
      </div>

      {/* ── Live Satellite Fetch ── */}
      <SatelliteFetch onResult={storeAndNav} />
    </div>
  )
}

const PRESETS = [
  { label: 'Delhi Railway Yard',   lat: 28.6392, lon: 77.2150 },
  { label: 'Mumbai Urban',         lat: 19.0534, lon: 72.8514 },
  { label: 'Bengaluru Tech Park',  lat: 12.9716, lon: 77.5946 },
  { label: 'Chennai Central',      lat: 13.0827, lon: 80.2707 },
]

function SatelliteFetch({ onResult }: { onResult: (r: DetectionResult, url: string) => void }) {
  const [lat, setLat]         = useState('')
  const [lon, setLon]         = useState('')
  const [zoom, setZoom]       = useState('18')
  const [source, setSource]   = useState<'esri' | 'bhuvan'>('esri')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const run = async () => {
    if (!lat || !lon) { setError('Enter latitude and longitude'); return }
    setLoading(true); setError('')
    try {
      const result = await fetchSatellite(parseFloat(lat), parseFloat(lon), parseInt(zoom), source)
      onResult(result, result.source_url ?? result.annotated_url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fetch failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">Live Satellite Fetch</span>
        <div className="flex-1 h-px bg-border"/>
        <span className="font-mono text-[9px] text-tx3">ESRI World Imagery · Bhuvan ISRO</span>
      </div>

      <div className="flex flex-col gap-px bg-border">

        {/* Preset locations */}
        <div className="bg-panel px-4 py-3 flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 mr-1">Presets</span>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setLat(String(p.lat)); setLon(String(p.lon)) }}
              className="px-2.5 py-1 border border-border font-mono text-[9px] text-tx2 hover:text-tx hover:border-border2 transition-colors">
              {p.label}
            </button>
          ))}
        </div>

        {/* Coordinate + config row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
          {[
            { label: 'Latitude',  val: lat,  set: setLat,  ph: '28.6392' },
            { label: 'Longitude', val: lon,  set: setLon,  ph: '77.2150' },
          ].map(f => (
            <div key={f.label} className="bg-panel px-3 py-2.5">
              <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-tx3 mb-1.5">{f.label}</div>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                className="w-full bg-transparent font-mono text-sm text-tx focus:outline-none placeholder:text-tx3"
                style={{ appearance: 'textfield' } as React.CSSProperties}/>
            </div>
          ))}

          {/* Zoom */}
          <div className="bg-panel px-3 py-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-tx3 mb-1.5">Zoom Level</div>
            <select value={zoom} onChange={e => setZoom(e.target.value)}
              className="w-full bg-transparent font-mono text-sm text-tx focus:outline-none">
              <option value="16">16 — 1.2 m/px</option>
              <option value="17">17 — 0.6 m/px</option>
              <option value="18">18 — 0.3 m/px</option>
              <option value="19">19 — 0.15 m/px</option>
            </select>
          </div>

          {/* Source */}
          <div className="bg-panel px-3 py-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-tx3 mb-1.5">Source</div>
            <select value={source} onChange={e => setSource(e.target.value as 'esri' | 'bhuvan')}
              className="w-full bg-transparent font-mono text-sm text-tx focus:outline-none">
              <option value="esri">ESRI World Imagery</option>
              <option value="bhuvan">Bhuvan ISRO (India)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-panel border-t border-[#f85149]/40 px-4 py-2.5">
            <span className="font-mono text-[10px] text-[#f85149]">{error}</span>
          </div>
        )}

        <button onClick={run} disabled={loading}
          className="w-full py-3.5 bg-[#1f6feb] font-mono text-[11px] uppercase tracking-[0.2em] font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
          {loading
            ? <><Loader2 size={14} className="animate-spin"/>Fetching Satellite + Detecting…</>
            : <><Satellite size={13}/>Fetch Live Satellite & Detect</>}
        </button>
      </div>
    </div>
  )
}

function SampleCard({ sample, loading, onRun }: { sample: SampleMeta; loading: boolean; onRun: () => void }) {
  const available = sample.available
  return (
    <div className={`bg-surface flex flex-col ${!available ? 'opacity-50' : ''}`}>
      <div className="relative h-40 bg-panel overflow-hidden border-b border-border">
        {available ? (
          <img src={sample.url} alt={sample.label} className="w-full h-full object-cover"/>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <UploadCloud size={20} className="text-tx3"/>
            <span className="font-mono text-[8px] text-tx3 uppercase tracking-widest">No image</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {sample.source?.startsWith('SpaceNet') && (
            <span className="font-mono text-[8px] bg-[#a371f7]/90 text-[#07080b] px-2 py-0.5 uppercase">
              SpaceNet
            </span>
          )}
          <span className="font-mono text-[8px] bg-[#07080b]/80 text-tx3 px-2 py-0.5">
            {sample.gsd}m
          </span>
        </div>
        {sample.gt_buildings !== undefined && (
          <div className="absolute bottom-2 left-2">
            <span className="font-mono text-[8px] bg-[#07080b]/80 text-[#3fb950] px-2 py-0.5">
              {sample.gt_buildings} GT
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tx mb-1 truncate">{sample.label}</div>
        <p className="text-tx3 text-[11px] leading-relaxed mb-4 flex-1 line-clamp-2">{sample.desc}</p>
        <button
          onClick={onRun}
          disabled={!available || loading}
          className="w-full flex items-center justify-center gap-2 py-2 border border-border font-mono text-[10px] uppercase tracking-widest text-tx2 hover:text-tx hover:border-border2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          {loading ? <><Loader2 size={11} className="animate-spin"/>Detecting…</> : <><Zap size={11}/>Analyse</>}
        </button>
      </div>
    </div>
  )
}
