import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Map, ImageIcon } from 'lucide-react'
import type { DetectionResult } from '../types'
import DetectionCanvas from '../components/DetectionCanvas'
import SummaryPanel from '../components/SummaryPanel'
import CategoryFilter from '../components/CategoryFilter'
import MapView from '../components/MapView'
import ExportBar from '../components/ExportBar'

type Tab = 'interactive' | 'annotated' | 'map'

export default function ResultsPage() {
  const nav = useNavigate()
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())
  const [minConf, setMinConf] = useState(0)
  const [tab, setTab] = useState<Tab>('interactive')

  useEffect(() => {
    const raw = sessionStorage.getItem('detectionResult')
    const url = sessionStorage.getItem('previewUrl')
    if (!raw) { nav('/'); return }
    const r: DetectionResult = JSON.parse(raw)
    setResult(r)
    setPreviewUrl(url ?? '')
    setActiveCategories(new Set(Object.keys(r.summary.by_category)))
  }, [])

  if (!result) return null

  const toggleCat = (cat: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'interactive', label: 'Interactive', icon: <ImageIcon size={13} /> },
    { id: 'annotated', label: 'Annotated', icon: <ImageIcon size={13} /> },
    { id: 'map', label: 'Map View', icon: <Map size={13} /> },
  ]

  const hasGeo = !!result.origin

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => nav('/')}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> New Detection
        </button>
        <span className="text-border">|</span>
        <span className="text-xs text-muted">
          Job <span className="text-white font-mono">{result.job_id}</span>
        </span>
        <span className="text-xs text-muted ml-auto">
          {result.image_width}×{result.image_height}px · GSD {result.gsd_m}m/px
        </span>
        <ExportBar jobId={result.job_id} />
      </div>

      {/* Main layout */}
      <div className="flex gap-5 items-start">
        {/* Left — image viewer */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            {tabs.map(t => {
              if (t.id === 'map' && !hasGeo) return null
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-muted hover:text-white border border-transparent hover:border-border'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              )
            })}
          </div>

          {/* Filter bar */}
          {tab !== 'map' && (
            <div className="mb-3 bg-surface border border-border rounded-xl px-4 py-3">
              <CategoryFilter
                categories={result.summary.by_category}
                active={activeCategories}
                onToggle={toggleCat}
                minConf={minConf}
                onConfChange={setMinConf}
              />
            </div>
          )}

          {/* Viewer */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {tab === 'interactive' && (
              <DetectionCanvas
                imageUrl={previewUrl}
                detections={result.detections}
                activeCategories={activeCategories}
                minConf={minConf}
              />
            )}
            {tab === 'annotated' && (
              <img
                src={result.annotated_url}
                alt="annotated"
                className="w-full h-auto block"
              />
            )}
            {tab === 'map' && hasGeo && (
              <div className="h-[520px]">
                <MapView
                  detections={result.detections}
                  origin={result.origin}
                  activeCategories={activeCategories}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right — summary */}
        <div className="w-80 shrink-0 bg-surface border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Detection Summary</h2>
          <SummaryPanel
            total={result.summary.total}
            byCategory={result.summary.by_category}
          />
        </div>
      </div>
    </div>
  )
}
