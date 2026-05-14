import { useState, useRef, useCallback } from 'react'
import { UploadCloud, Loader2, GitCompare, AlertTriangle, ArrowRight } from 'lucide-react'
import { detectChanges } from '../api/client'
import type { ChangeResult } from '../types'

const CHANGE_COLORS: Record<string, string> = {
  new_construction: '#dc3545',
  vegetation_loss:  '#f97316',
  new_water:        '#1f6feb',
  encroachment:     '#ef4444',
}
const CHANGE_LABELS: Record<string, string> = {
  new_construction: 'New Construction',
  vegetation_loss:  'Vegetation Loss',
  new_water:        'New Water Body',
  encroachment:     'Encroachment',
}

function DropZone({ label, badge, file, onFile }: { label: string; badge: string; file: File | null; onFile: (f: File) => void }) {
  const ref  = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const url  = file ? URL.createObjectURL(file) : null

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }, [onFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[200px] flex items-center justify-center group ${
        drag ? 'border-orange-400 bg-orange-500/8'
        : file ? 'border-emerald-500/40 bg-emerald-500/5'
        : 'border-slate-700 hover:border-orange-500/50 hover:bg-slate-800/30'
      }`}
    >
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff" className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}/>
      {/* Badge */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
        {badge}
      </div>
      {url ? (
        <>
          <img src={url} alt={label} className="w-full h-48 object-cover"/>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent px-3 py-2">
            <span className="text-xs text-white truncate block">{file?.name}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2.5 text-center p-8 mt-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-orange-500/30 transition-colors">
            <UploadCloud size={22} className="text-orange-400"/>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">Drop or click to browse</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChangePage() {
  const [before, setBefore] = useState<File | null>(null)
  const [after,  setAfter]  = useState<File | null>(null)
  const [gsd,    setGsd]    = useState(0.5)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<ChangeResult | null>(null)
  const [error,   setError]   = useState('')
  const [view,    setView]    = useState<'overlay' | 'comparison'>('overlay')

  const run = async () => {
    if (!before || !after) return
    setLoading(true); setError('')
    try {
      setResult(await detectChanges(before, after, gsd))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-screen-lg mx-auto px-5 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/8 text-xs text-orange-400 font-medium mb-5">
          <GitCompare size={12}/> Temporal Analysis
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Change Detection</h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
          Upload two images of the same area taken at different times.
          The system detects encroachments, new construction, vegetation loss, and water body changes.
        </p>
      </div>

      {!result ? (
        <>
          {/* Drop zones */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <DropZone label="Earlier image" badge="Before" file={before} onFile={setBefore}/>
            <DropZone label="Recent image"  badge="After"  file={after}  onFile={setAfter}/>
          </div>

          {/* GSD */}
          <div className="flex items-center gap-3 mb-5">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Ground Sampling Distance (m/px):
              <input type="number" value={gsd} onChange={e => setGsd(parseFloat(e.target.value))}
                step={0.1} min={0.01}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:outline-none focus:border-orange-500/60 transition-colors"/>
            </label>
          </div>

          {error && (
            <p className="mb-4 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <AlertTriangle size={13}/>{error}
            </p>
          )}

          <button onClick={run} disabled={!before || !after || loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20">
            {loading
              ? <><Loader2 size={15} className="animate-spin"/>Analysing temporal changes…</>
              : <>Detect Changes <ArrowRight size={14}/></>}
          </button>
        </>
      ) : (
        <div className="flex gap-5">
          {/* Image */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              {(['overlay', 'comparison'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    view === v
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'text-slate-500 border-transparent hover:border-slate-700 hover:text-slate-200'
                  }`}>
                  {v === 'overlay' ? 'Change Overlay' : 'Side-by-side'}
                </button>
              ))}
              <button onClick={() => setResult(null)}
                className="ml-auto text-xs text-slate-500 hover:text-white transition-colors">
                ← New analysis
              </button>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <img src={view === 'overlay' ? result.overlay_url : result.comparison_url}
                alt="change" className="w-full h-auto block"/>
            </div>
          </div>

          {/* Summary panel */}
          <div className="w-72 shrink-0 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-1">Change Summary</h2>
            <p className="text-xs text-slate-500 mb-5">Temporal analysis results</p>

            <div className="mb-5">
              <span className="text-4xl font-extrabold text-white">{result.total_changes}</span>
              <span className="text-sm text-slate-500 ml-2">changes detected</span>
            </div>

            <div className="flex flex-col gap-2">
              {Object.entries(result.change_summary).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2.5 bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/60">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHANGE_COLORS[type] ?? '#888' }}/>
                  <span className="text-xs text-slate-300 flex-1">{CHANGE_LABELS[type] ?? type}</span>
                  <span className="text-xs font-semibold text-white">{count}</span>
                </div>
              ))}
              {result.total_changes === 0 && (
                <p className="text-slate-600 text-xs text-center py-4">
                  No significant changes detected between the two images.
                </p>
              )}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Legend</p>
              {Object.entries(CHANGE_LABELS).map(([type, label]) => (
                <div key={type} className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: CHANGE_COLORS[type] }}/>
                  <span className="text-[10px] text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
