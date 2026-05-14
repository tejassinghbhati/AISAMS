import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Map, ImageIcon, Layers, Sparkles } from 'lucide-react'
import type { DetectionResult } from '../types'
import DetectionCanvas from '../components/DetectionCanvas'
import SummaryPanel from '../components/SummaryPanel'
import CategoryFilter from '../components/CategoryFilter'
import MapView from '../components/MapView'
import ExportBar from '../components/ExportBar'
import EvalBanner from '../components/EvalBanner'

type Tab = 'interactive' | 'annotated' | 'map'

export default function ResultsPage() {
  const nav = useNavigate()
  const [result, setResult]         = useState<DetectionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [activeCategories, setActive] = useState<Set<string>>(new Set())
  const [minConf, setMinConf]       = useState(0)
  const [tab, setTab]               = useState<Tab>('interactive')

  useEffect(() => {
    const raw = sessionStorage.getItem('detectionResult')
    const url = sessionStorage.getItem('previewUrl')
    if (!raw) { nav('/'); return }
    const r: DetectionResult = JSON.parse(raw)
    setResult(r)
    setPreviewUrl(url ?? '')
    setActive(new Set(Object.keys(r.summary.by_category)))
  }, [])

  if (!result) return null

  const toggleCat = (cat: string) => setActive(prev => {
    const next = new Set(prev)
    next.has(cat) ? next.delete(cat) : next.add(cat)
    return next
  })

  const hasGeo = !!result.origin
  const tabs: { id: Tab; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'interactive', label: 'Interactive Overlay', icon: <Layers size={13}/> },
    { id: 'annotated',   label: 'AI Annotated',        icon: <Sparkles size={13}/> },
    { id: 'map',         label: 'GIS Map',              icon: <Map size={13}/>, hidden: !hasGeo },
  ]

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 py-5">

      <EvalBanner />

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={() => nav('/')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
          <ArrowLeft size={13}/> New Detection
        </button>
        <span className="text-slate-800">|</span>
        <span className="text-xs text-slate-500">
          Job <span className="text-white font-mono tracking-wide">{result.job_id}</span>
        </span>
        {result.summary.total > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
            {result.summary.total} assets detected
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-600 font-mono hidden sm:block">
            {result.image_width}×{result.image_height}px · GSD {result.gsd_m}m/px
          </span>
          <ExportBar jobId={result.job_id}/>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="flex gap-4 items-start">

        {/* Left: viewer */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex gap-1 mb-3">
            {tabs.filter(t => !t.hidden).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  tab === t.id
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'text-slate-500 border-transparent hover:text-slate-200 hover:bg-slate-800/60'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Filter bar — only for image views */}
          {tab !== 'map' && (
            <div className="mb-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <CategoryFilter
                categories={result.summary.by_category}
                active={activeCategories}
                onToggle={toggleCat}
                minConf={minConf}
                onConfChange={setMinConf}
              />
            </div>
          )}

          {/* Image panel */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
            {tab === 'interactive' && (
              <DetectionCanvas
                imageUrl={previewUrl}
                detections={result.detections}
                activeCategories={activeCategories}
                minConf={minConf}
              />
            )}
            {tab === 'annotated' && (
              <img src={result.annotated_url} alt="annotated" className="w-full h-auto block"/>
            )}
            {tab === 'map' && hasGeo && (
              <div className="h-[560px]">
                <MapView
                  detections={result.detections}
                  origin={result.origin}
                  activeCategories={activeCategories}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: summary */}
        <div className="w-80 shrink-0 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={14} className="text-blue-400"/> Detection Summary
          </h2>
          <SummaryPanel total={result.summary.total} byCategory={result.summary.by_category}/>
        </div>
      </div>
    </div>
  )
}
