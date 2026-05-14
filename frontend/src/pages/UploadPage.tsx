import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, MapPin, Ruler, Loader2, ArrowRight, Zap, Map, GitCompare, Crosshair } from 'lucide-react'
import { detectAssets } from '../api/client'
import LiveDetectionDemo from '../components/LiveDetectionDemo'
import type { DetectionResult } from '../types'

interface SampleMeta {
  file: string; label: string; desc: string
  lat: number; lon: number; gsd: number; url: string; available: boolean
  source?: string; gt_buildings?: number
}

const FEATURE_CARDS = [
  {
    icon: <Crosshair size={14}/>,
    code: 'MOD-01',
    title: 'Multi-source Ingestion',
    desc: 'Satellite tiles, aerial photos, drone captures — JPG / PNG / TIFF ingestion pipeline.',
    accent: '#388bfd',
  },
  {
    icon: <Zap size={14}/>,
    code: 'MOD-02',
    title: 'Hybrid AI Detection',
    desc: 'YOLOv8-seg for objects + HSV spectral segmentation for terrain classes.',
    accent: '#a371f7',
  },
  {
    icon: <Map size={14}/>,
    code: 'MOD-03',
    title: 'GIS Map Overlay',
    desc: 'Detected assets exported as GeoJSON layers on an interactive Leaflet map.',
    accent: '#3fb950',
  },
  {
    icon: <GitCompare size={14}/>,
    code: 'MOD-04',
    title: 'Change Detection',
    desc: 'Temporal differencing — encroachments, construction, vegetation and water changes.',
    accent: '#d29922',
  },
]

const ASSET_ROWS = [
  { label: 'BUILDING',  color: '#f85149', code: 'BLD' },
  { label: 'TREE',      color: '#3fb950', code: 'TRE' },
  { label: 'WATER',     color: '#388bfd', code: 'WAT' },
  { label: 'ROAD',      color: '#8b949e', code: 'RDA' },
  { label: 'DRAIN',     color: '#d29922', code: 'DRN' },
  { label: 'VEHICLE',   color: '#a371f7', code: 'VEH' },
  { label: 'PARK',      color: '#3fb950', code: 'PRK' },
]

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
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
    <div className="w-full">

      {/* ── HERO ── */}
      <section className="min-h-[calc(100vh-44px)] flex items-center border-b border-border">
        {/* dot grid background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(56,139,253,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}/>

        <div className="relative max-w-7xl mx-auto px-5 py-16 grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* ── Left copy ── */}
          <div>
            {/* breadcrumb tag */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 bg-accent inline-block"/>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">
                Indian Railways × eGov DIGIT Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3rem] font-bold leading-[1.1] tracking-tight mb-5 text-tx">
              AI Asset Intelligence<br/>
              <span style={{ color: '#388bfd' }}>from Orbit</span>
            </h1>

            <p className="text-tx2 text-sm leading-relaxed mb-8 max-w-xl">
              Process satellite, aerial or drone imagery to automatically detect
              and classify urban infrastructure across India's{' '}
              <span className="text-tx font-medium">68,000 km</span> railway network.
            </p>

            {/* Asset class table */}
            <div className="border border-border mb-8 inline-block">
              <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-panel">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3">DETECTION CLASSES</span>
                <span className="font-mono text-[8px] text-tx3 ml-auto">{ASSET_ROWS.length} targets</span>
              </div>
              {ASSET_ROWS.map((a, i) => (
                <div key={a.code} className="flex items-center gap-3 px-3 py-1.5"
                  style={{ borderBottom: i < ASSET_ROWS.length - 1 ? '1px solid #21262d' : undefined }}>
                  <span className="font-mono text-[9px] text-tx3 w-8">{a.code}</span>
                  <span className="w-1.5 h-1.5 shrink-0" style={{ background: a.color }}/>
                  <span className="font-mono text-[10px] text-tx2">{a.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-[#07080b] text-sm font-semibold transition-opacity hover:opacity-90">
                Upload Image <ArrowRight size={14}/>
              </button>
              {samples.length > 0 && (
                <button
                  onClick={() => document.getElementById('samples')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-5 py-2.5 border border-border text-tx2 hover:text-tx hover:border-border2 text-sm font-medium transition-colors">
                  Try Demo Image
                </button>
              )}
            </div>

            {/* Stat row */}
            <div className="flex gap-px mt-10 border border-border overflow-hidden">
              {[['68K km', 'Rail network'], ['7', 'Asset classes'], ['<1 s', 'Inference'], ['GeoJSON', 'Export']].map(([v, l]) => (
                <div key={l} className="flex-1 bg-panel px-3 py-2.5">
                  <div className="font-mono text-base font-bold text-tx">{v}</div>
                  <div className="font-mono text-[8px] uppercase tracking-widest text-tx3 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: live demo ── */}
          <div>
            <LiveDetectionDemo />
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-1 h-1 bg-tx3 inline-block"/>
              <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">Animated preview · YOLOv8-seg + spectral segmentation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE MODULES ── */}
      <section className="border-b border-border py-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center gap-3 mb-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">SYSTEM MODULES</span>
            <div className="flex-1 h-px bg-border"/>
            <span className="font-mono text-[9px] text-tx3">v2.0</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {FEATURE_CARDS.map(f => (
              <div key={f.code} className="bg-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 border" style={{ borderColor: f.accent + '40', color: f.accent }}>
                    {f.icon}
                  </span>
                  <span className="font-mono text-[9px] text-tx3 ml-auto">{f.code}</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-tx mb-2">{f.title}</div>
                <p className="text-tx3 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE GALLERY ── */}
      {samples.length > 0 && (
        <section id="samples" className="border-b border-border py-16">
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex items-center gap-3 mb-8">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">SAMPLE IMAGERY</span>
              <div className="flex-1 h-px bg-border"/>
              <span className="font-mono text-[9px] text-tx3">SpaceNet SN4 · WorldView-2</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-px bg-border">
              {samples.map(s => (
                <SampleCard key={s.file} sample={s} loading={sampleLoading === s.file} onRun={() => runSample(s)}/>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── UPLOAD SECTION ── */}
      <section ref={uploadRef} id="upload" className="py-16 scroll-mt-11">
        <div className="max-w-2xl mx-auto px-5">
          <div className="flex items-center gap-3 mb-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">IMAGE INPUT</span>
            <div className="flex-1 h-px bg-border"/>
            <span className="font-mono text-[9px] text-tx3">JPG · PNG · TIFF</span>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="relative border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[200px] flex items-center justify-center"
            style={{
              borderColor: dragging ? '#388bfd' : file ? '#3fb950' : '#30363d',
              background: dragging ? 'rgba(56,139,253,0.04)' : file ? 'rgba(63,185,80,0.04)' : '#0d1117',
            }}
          >
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff" className="hidden"
              onChange={e => e.target.files?.[0] && pick(e.target.files[0])}/>
            {preview ? (
              <>
                <img src={preview} alt="preview" className="w-full h-auto max-h-80 object-contain"/>
                <div className="absolute inset-x-0 bottom-0 border-t border-border bg-panel px-4 py-2 flex items-center gap-3">
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

          {/* Metadata inputs */}
          <div className="mt-px grid grid-cols-3 gap-px bg-border">
            {[
              { label: 'GSD M/PX', icon: <Ruler size={10}/>, val: gsd.toString(), set: (v: string) => setGsd(parseFloat(v)), type: 'number', step: '0.1', min: '0.01', ph: '' },
              { label: 'LATITUDE',  icon: <MapPin size={10}/>,  val: lat, set: setLat, type: 'number', step: '', min: '', ph: '28.6139' },
              { label: 'LONGITUDE', icon: <MapPin size={10}/>,  val: lon, set: setLon, type: 'number', step: '', min: '', ph: '77.2090' },
            ].map(f => (
              <div key={f.label} className="bg-panel px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-tx3">{f.icon}</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-tx3">{f.label}</span>
                </div>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                  step={f.step || undefined} min={f.min || undefined} placeholder={f.ph}
                  className="w-full bg-transparent font-mono text-sm text-tx focus:outline-none placeholder:text-tx3"
                  style={{ appearance: 'textfield' }}/>
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
      </section>
    </div>
  )
}

function SampleCard({ sample, loading, onRun }: { sample: SampleMeta; loading: boolean; onRun: () => void }) {
  const available = sample.available
  return (
    <div className={`bg-surface flex flex-col ${!available ? 'opacity-50' : ''}`}>
      {/* Image */}
      <div className="relative h-44 bg-panel overflow-hidden border-b border-border">
        {available ? (
          <img src={sample.url} alt={sample.label} className="w-full h-full object-cover"/>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface">
            <UploadCloud size={22} className="text-tx3"/>
            <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">No image available</span>
          </div>
        )}
        {/* overlays */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {sample.source?.startsWith('SpaceNet') && (
            <span className="font-mono text-[8px] bg-[#a371f7]/90 text-[#07080b] px-2 py-0.5 uppercase tracking-wider">
              SpaceNet SN4
            </span>
          )}
          <span className="font-mono text-[8px] bg-[#07080b]/80 text-tx3 px-2 py-0.5">
            GSD {sample.gsd}m
          </span>
        </div>
        {sample.gt_buildings !== undefined && (
          <div className="absolute bottom-2 left-2">
            <span className="font-mono text-[8px] bg-[#07080b]/80 text-[#3fb950] px-2 py-0.5">
              {sample.gt_buildings} GT bldgs
            </span>
          </div>
        )}
      </div>

      {/* Content */}
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
