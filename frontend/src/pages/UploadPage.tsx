import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud, MapPin, Ruler, Loader2, ArrowRight,
  Building2, Trees, Droplets, Car, Zap, Map,
  ChevronRight, FlaskConical, Satellite
} from 'lucide-react'
import { detectAssets } from '../api/client'
import LiveDetectionDemo from '../components/LiveDetectionDemo'
import type { DetectionResult } from '../types'

// ─── Sample gallery ────────────────────────────────────────────────────────

interface SampleMeta {
  file: string; label: string; desc: string
  lat: number; lon: number; gsd: number; url: string; available: boolean
  source?: string; gt_buildings?: number
}

const FEATURE_CARDS = [
  {
    icon: <Satellite size={20}/>,
    title: 'Multi-source Ingestion',
    desc: 'Upload satellite tiles, aerial photos, or drone captures in JPG/PNG/TIFF.',
    color: 'blue',
  },
  {
    icon: <Zap size={20}/>,
    title: 'Hybrid AI Detection',
    desc: 'YOLOv8 for objects + spectral segmentation for terrain — no GPU required.',
    color: 'violet',
  },
  {
    icon: <Map size={20}/>,
    title: 'GIS Map Overlay',
    desc: 'Detected assets rendered as GeoJSON layers on an interactive Leaflet map.',
    color: 'emerald',
  },
  {
    icon: <FlaskConical size={20}/>,
    title: 'Change Detection',
    desc: 'Compare two images: spot encroachments, new construction, vegetation loss.',
    color: 'orange',
  },
]

const COLOR_MAP: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
}

const ASSET_PILLS = [
  { icon: <Building2 size={11}/>, label: 'Buildings', color: '#dc3545' },
  { icon: <Trees size={11}/>,     label: 'Trees',     color: '#22863a' },
  { icon: <Droplets size={11}/>,  label: 'Water',     color: '#1f6feb' },
  { icon: <Car size={11}/>,       label: 'Vehicles',  color: '#8957e5' },
]

// ─── Component ─────────────────────────────────────────────────────────────

export default function UploadPage() {
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
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
      .catch(() => {/* samples optional */})
  }, [])

  const pick = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* ══════════════════════ HERO ═══════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-56px)] flex items-center overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}/>
          <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }}/>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-[0.04]"
            style={{ background: 'radial-gradient(ellipse, #10b981, transparent 70%)' }}/>
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}/>
        </div>

        <div className="relative max-w-7xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-14 items-center w-full">

          {/* ── Left: Copy ── */}
          <div className="opacity-0 animate-fade-up">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/8 text-xs text-blue-400 font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
              Indian Railways × eGov DIGIT Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-5">
              AI Asset Intelligence{' '}
              <span className="gradient-text">from Above</span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
              Process satellite, aerial or drone imagery to automatically detect
              and classify urban infrastructure across India's{' '}
              <span className="text-slate-200 font-medium">68,000 km</span> railway network —
              buildings, encroachments, water bodies, green cover and more.
            </p>

            {/* Asset pill row */}
            <div className="flex flex-wrap gap-2 mb-8">
              {ASSET_PILLS.map(p => (
                <span key={p.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700 text-slate-300"
                  style={{ backgroundColor: p.color + '18' }}>
                  <span style={{ color: p.color }}>{p.icon}</span>
                  {p.label}
                </span>
              ))}
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700 text-slate-500">
                +3 more
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-all shadow-lg shadow-blue-900/30"
              >
                Upload Image <ArrowRight size={15}/>
              </button>
              {samples.length > 0 && (
                <button
                  onClick={() => document.getElementById('samples')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-sm transition-all"
                >
                  Try a Demo Image <ChevronRight size={15}/>
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-slate-800">
              {[
                ['68K km', 'Railway network'],
                ['7', 'Asset classes'],
                ['<1 s', 'Inference time'],
                ['GeoJSON', 'Export ready'],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="text-xl font-bold text-white">{v}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Live demo ── */}
          <div className="opacity-0 animate-fade-up delay-200">
            <LiveDetectionDemo />
            <p className="text-center text-xs text-slate-600 mt-3">
              Animated preview · YOLOv8-seg + spectral segmentation
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURES ════════════════════════════════════ */}
      <section className="border-t border-slate-800/60 py-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">Full-stack geospatial pipeline</h2>
            <p className="text-slate-500 text-sm">From raw imagery to actionable asset intelligence</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURE_CARDS.map(f => (
              <div key={f.title} className={`glass-card rounded-2xl p-5 border ${COLOR_MAP[f.color].split(' ').slice(2).join(' ')}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${COLOR_MAP[f.color].split(' ').slice(0,2).join(' ')} border ${COLOR_MAP[f.color].split(' ')[2]}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ SAMPLE GALLERY ══════════════════════════════ */}
      {samples.length > 0 && (
        <section id="samples" className="border-t border-slate-800/60 py-20">
          <div className="max-w-7xl mx-auto px-5">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">Try with real imagery</h2>
              <p className="text-slate-500 text-sm">
                SpaceNet SN4 (WorldView-2, Atlanta) &amp; OpenAerialMap public domain imagery ·
                run <code className="text-violet-400 text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">process_spacenet.py --tar summaryData.tar.gz</code> to load your dataset
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {samples.map(s => (
                <SampleCard
                  key={s.file}
                  sample={s}
                  loading={sampleLoading === s.file}
                  onRun={() => runSample(s)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════ UPLOAD SECTION ══════════════════════════════ */}
      <section ref={uploadRef} id="upload" className="border-t border-slate-800/60 py-20 scroll-mt-14">
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Upload your image</h2>
            <p className="text-slate-500 text-sm">
              Satellite · Aerial · Drone · JPG / PNG / TIFF
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[220px] flex items-center justify-center group ${
              dragging ? 'border-blue-400 bg-blue-500/8'
              : file    ? 'border-emerald-500/60 bg-emerald-500/5'
              : 'border-slate-700 hover:border-blue-500/60 hover:bg-slate-800/30'
            }`}
          >
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff" className="hidden"
              onChange={e => e.target.files?.[0] && pick(e.target.files[0])}/>
            {preview ? (
              <>
                <img src={preview} alt="preview" className="w-full h-auto max-h-80 object-contain"/>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4">
                  <span className="text-sm text-white font-medium">{file?.name}</span>
                  <span className="text-slate-400 text-xs ml-2">
                    {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-blue-500/40 transition-colors">
                  <UploadCloud size={26} className="text-blue-400"/>
                </div>
                <div>
                  <p className="text-white font-semibold">Drop satellite image here</p>
                  <p className="text-slate-500 text-sm mt-1">or click to browse files</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MetaInput label="GSD (m/px)" icon={<Ruler size={11}/>}>
              <input type="number" value={gsd} onChange={e => setGsd(parseFloat(e.target.value))}
                step={0.1} min={0.01}
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600"/>
            </MetaInput>
            <MetaInput label="Latitude" icon={<MapPin size={11}/>}>
              <input type="number" value={lat} onChange={e => setLat(e.target.value)}
                placeholder="28.6139"
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-700"/>
            </MetaInput>
            <MetaInput label="Longitude" icon={<MapPin size={11}/>}>
              <input type="number" value={lon} onChange={e => setLon(e.target.value)}
                placeholder="77.2090"
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-700"/>
            </MetaInput>
          </div>

          {error && (
            <p className="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={!file || loading}
            className="btn-glow mt-5 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
          >
            {loading ? <><Loader2 size={16} className="animate-spin"/>Detecting Assets…</> : <>Run Detection  <ArrowRight size={15}/></>}
          </button>

          <p className="text-center text-xs text-slate-600 mt-4">
            First run auto-downloads YOLOv8n (~6 MB) · CPU inference
          </p>
        </div>
      </section>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MetaInput({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 flex items-center gap-1">{icon}{label}</span>
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus-within:border-blue-500/60 transition-colors">
        {children}
      </div>
    </label>
  )
}

function SampleCard({ sample, loading, onRun }: { sample: SampleMeta; loading: boolean; onRun: () => void }) {
  const available   = sample.available
  const isSpaceNet  = sample.source?.startsWith('SpaceNet')
  const isOAM       = sample.source?.startsWith('OpenAerial') || (!isSpaceNet && available)

  return (
    <div className={`glass-card rounded-2xl overflow-hidden border border-slate-800 group transition-all hover:border-slate-600 ${!available ? 'opacity-50' : ''}`}>
      {/* Image */}
      <div className="relative h-44 bg-slate-900 overflow-hidden">
        {available ? (
          <img src={sample.url} alt={sample.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(59,130,246,0.15) 0%, transparent 50%), #0f172a' }}>
            <Satellite size={28} className="text-slate-600"/>
            <p className="text-xs text-slate-600">Run download_samples.py or process_spacenet.py</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"/>

        {/* Top badges row */}
        <div className="absolute top-2 left-2 right-2 flex items-center gap-1.5">
          {isSpaceNet && (
            <span className="text-[10px] font-semibold bg-violet-600/90 text-white px-2 py-0.5 rounded-full">
              SpaceNet SN4
            </span>
          )}
          {isOAM && !isSpaceNet && (
            <span className="text-[10px] font-semibold bg-blue-600/80 text-white px-2 py-0.5 rounded-full">
              OpenAerialMap
            </span>
          )}
          <span className="ml-auto text-[10px] font-mono bg-black/60 text-slate-300 px-2 py-0.5 rounded-full">
            GSD {sample.gsd}m
          </span>
        </div>

        {/* GT buildings badge */}
        {isSpaceNet && sample.gt_buildings !== undefined && (
          <div className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
            {sample.gt_buildings} GT buildings
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm font-semibold text-white mb-1 truncate">{sample.label}</p>
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{sample.desc}</p>
        <button
          onClick={onRun}
          disabled={!available || loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium text-slate-200"
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin"/>Detecting…</>
            : <><Zap size={12}/>Analyse this image</>}
        </button>
      </div>
    </div>
  )
}
