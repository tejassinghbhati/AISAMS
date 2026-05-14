import { useState, useRef, useCallback } from 'react'
import { UploadCloud, Loader2, GitCompare, AlertTriangle } from 'lucide-react'
import { detectChanges } from '../api/client'
import type { ChangeResult } from '../types'

const CHANGE_COLORS: Record<string, string> = {
  new_construction: '#dc3545',
  vegetation_loss: '#fd7e14',
  new_water: '#1f6feb',
  encroachment: '#ff0000',
}

const CHANGE_LABELS: Record<string, string> = {
  new_construction: 'New Construction',
  vegetation_loss: 'Vegetation Loss',
  new_water: 'New Water Body',
  encroachment: 'Encroachment',
}

function DropZone({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const url = file ? URL.createObjectURL(file) : null

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
      className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[180px] flex items-center justify-center ${
        drag ? 'border-orange-400 bg-orange-500/10' : file ? 'border-green-500/50' : 'border-border hover:border-orange-500/40 hover:bg-white/[0.02]'
      }`}
    >
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      {url ? (
        <>
          <img src={url} alt={label} className="w-full h-44 object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-canvas/70 text-xs text-white px-3 py-1.5 font-medium">{file?.name}</div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center p-6">
          <UploadCloud size={28} className="text-orange-400 opacity-70" />
          <p className="text-sm text-white font-medium">{label}</p>
          <p className="text-xs text-muted">Drop image or click</p>
        </div>
      )}
    </div>
  )
}

export default function ChangePage() {
  const [before, setBefore] = useState<File | null>(null)
  const [after, setAfter] = useState<File | null>(null)
  const [gsd, setGsd] = useState(0.5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ChangeResult | null>(null)
  const [error, setError] = useState('')
  const [view, setView] = useState<'overlay' | 'comparison'>('overlay')

  const run = async () => {
    if (!before || !after) return
    setLoading(true)
    setError('')
    try {
      const r = await detectChanges(before, after, gsd)
      setResult(r)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-screen-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <GitCompare className="text-orange-400" size={24} /> Change Detection
        </h1>
        <p className="text-muted text-sm">
          Upload two images of the same area taken at different times to detect encroachments,
          new construction, vegetation loss, and water changes.
        </p>
      </div>

      {!result && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted mb-1.5 font-medium uppercase tracking-wide">Before</p>
              <DropZone label="Earlier image" file={before} onFile={setBefore} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1.5 font-medium uppercase tracking-wide">After</p>
              <DropZone label="Recent image" file={after} onFile={setAfter} />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-xs text-muted">
              GSD (m/px):
              <input type="number" value={gsd} onChange={e => setGsd(parseFloat(e.target.value))} step={0.1} min={0.01}
                className="bg-surface border border-border rounded px-2 py-1 text-sm text-white w-20 focus:outline-none focus:border-orange-500" />
            </label>
          </div>

          {error && (
            <p className="mb-3 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={13} /> {error}
            </p>
          )}

          <button onClick={run} disabled={!before || !after || loading}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Analysing changes…</> : 'Detect Changes'}
          </button>
        </>
      )}

      {result && (
        <div className="flex gap-5">
          {/* Image */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-1 mb-3">
              {(['overlay', 'comparison'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === v ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-muted border border-transparent hover:border-border'}`}>
                  {v === 'overlay' ? 'Change Overlay' : 'Side-by-side'}
                </button>
              ))}
              <button onClick={() => setResult(null)} className="ml-auto text-xs text-muted hover:text-white">
                ← New analysis
              </button>
            </div>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <img src={view === 'overlay' ? result.overlay_url : result.comparison_url} alt="change" className="w-full h-auto block" />
            </div>
          </div>

          {/* Summary */}
          <div className="w-72 shrink-0 bg-surface border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-4">Change Summary</h2>
            <div className="text-2xl font-bold text-white mb-4">
              {result.total_changes}
              <span className="text-sm font-normal text-muted ml-2">changes detected</span>
            </div>
            <div className="flex flex-col gap-2">
              {Object.entries(result.change_summary).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-border">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHANGE_COLORS[type] ?? '#888' }} />
                  <span className="text-xs flex-1">{CHANGE_LABELS[type] ?? type}</span>
                  <span className="text-xs text-muted">{count}</span>
                </div>
              ))}
            </div>
            {result.total_changes === 0 && (
              <p className="text-muted text-xs mt-4 text-center">No significant changes detected</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
