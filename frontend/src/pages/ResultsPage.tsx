import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Map, Layers, Sparkles, Send, X, CheckCircle } from 'lucide-react'
import type { DetectionResult, DigitPushResult } from '../types'
import DetectionCanvas from '../components/DetectionCanvas'
import SummaryPanel from '../components/SummaryPanel'
import CategoryFilter from '../components/CategoryFilter'
import MapView from '../components/MapView'
import ExportBar from '../components/ExportBar'
import EvalBanner from '../components/EvalBanner'
import { digitPush } from '../api/client'

type Tab = 'interactive' | 'annotated' | 'map'

export default function ResultsPage() {
  const nav = useNavigate()
  const [result, setResult]           = useState<DetectionResult | null>(null)
  const [previewUrl, setPreviewUrl]   = useState('')
  const [activeCategories, setActive] = useState<Set<string>>(new Set())
  const [minConf, setMinConf]         = useState(0)
  const [tab, setTab]                 = useState<Tab>('interactive')
  const [digitResult, setDigitResult] = useState<DigitPushResult | null>(null)
  const [digitLoading, setDigitLoading] = useState(false)
  const [digitError, setDigitError]   = useState('')

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
    { id: 'interactive', label: 'Interactive',  icon: <Layers size={11}/>  },
    { id: 'annotated',   label: 'AI Annotated', icon: <Sparkles size={11}/> },
    { id: 'map',         label: 'GIS Map',       icon: <Map size={11}/>,  hidden: !hasGeo },
  ]

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 py-5">

      <EvalBanner />

      {/* ── top bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 border-b border-border pb-4">
        <button onClick={() => nav('/')}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-tx3 hover:text-tx transition-colors">
          <ArrowLeft size={11}/> New Detection
        </button>
        <div className="w-px h-3 bg-border2"/>
        <span className="font-mono text-[10px] text-tx3">
          JOB <span className="text-tx tracking-wide">{result.job_id}</span>
        </span>
        {result.summary.total > 0 && (
          <div className="flex items-center gap-1.5 border border-[#3fb950]/30 px-2.5 py-1 bg-[#3fb950]/08">
            <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block"/>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#3fb950]">
              {result.summary.total} assets detected
            </span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-4">
          <span className="font-mono text-[9px] text-tx3 hidden sm:block uppercase tracking-wider">
            {result.image_width}×{result.image_height}px · GSD {result.gsd_m}m/px
          </span>
          <ExportBar jobId={result.job_id}/>
          <button
            onClick={async () => {
              setDigitLoading(true); setDigitError(''); setDigitResult(null)
              try { setDigitResult(await digitPush(result.job_id)) }
              catch (e: unknown) { setDigitError(e instanceof Error ? e.message : 'Push failed') }
              finally { setDigitLoading(false) }
            }}
            disabled={digitLoading}
            className="flex items-center gap-1.5 px-3 py-1 border border-[#a371f7]/40 bg-[#a371f7]/08 font-mono text-[9px] uppercase tracking-widest text-[#a371f7] hover:border-[#a371f7] transition-colors disabled:opacity-40">
            <Send size={10}/>{digitLoading ? 'Pushing…' : 'Push to DIGIT'}
          </button>
        </div>
      </div>

      {/* ── DIGIT push result panel ── */}
      {(digitResult || digitError) && (
        <div className={`mb-4 border px-4 py-3 flex items-start gap-3 ${digitError ? 'border-[#f85149]/40 bg-[#f85149]/08' : 'border-[#a371f7]/30 bg-[#a371f7]/08'}`}>
          {digitError
            ? <span className="font-mono text-[10px] text-[#f85149]">{digitError}</span>
            : digitResult && (
              <div className="flex-1 flex items-start gap-3">
                <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#a371f7' }}/>
                <div className="font-mono text-[10px] text-[#a371f7]">
                  <span className="font-semibold">{digitResult.pushed} assets</span> pushed to mock DIGIT Urban Asset Registry
                  <span className="text-tx3 ml-3">Registry ID: {digitResult.registryId}</span>
                </div>
              </div>
            )
          }
          <button onClick={() => { setDigitResult(null); setDigitError('') }} className="shrink-0 text-tx3 hover:text-tx">
            <X size={12}/>
          </button>
        </div>
      )}

      {/* ── split layout ── */}
      <div className="flex gap-px bg-border items-start">

        {/* Left: viewer */}
        <div className="flex-1 min-w-0 bg-bg flex flex-col gap-px">

          {/* Tab bar */}
          <div className="flex border-b border-border bg-panel">
            {tabs.filter(t => !t.hidden).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors border-r border-border"
                style={tab === t.id
                  ? { color: '#388bfd', borderBottom: '2px solid #388bfd', background: 'rgba(56,139,253,0.06)' }
                  : { color: '#484f58', borderBottom: '2px solid transparent' }
                }>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          {tab !== 'map' && (
            <div className="border-b border-border bg-panel px-4 py-3">
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
          <div className="bg-surface overflow-hidden">
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
        <div className="w-72 shrink-0 bg-bg flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-panel flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent inline-block"/>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-tx2">Detection Summary</span>
          </div>
          <div className="p-4">
            <SummaryPanel total={result.summary.total} byCategory={result.summary.by_category}/>
          </div>
        </div>
      </div>
    </div>
  )
}
