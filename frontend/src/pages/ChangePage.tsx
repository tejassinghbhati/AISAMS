import { useState, useRef, useCallback } from 'react'
import { UploadCloud, Loader2, GitCompare, AlertTriangle, ArrowRight } from 'lucide-react'
import { detectChanges } from '../api/client'
import type { ChangeResult } from '../types'

const CHANGE_COLORS: Record<string, string> = {
  new_construction: '#f85149',
  vegetation_loss:  '#d29922',
  new_water:        '#388bfd',
  encroachment:     '#a371f7',
}
const CHANGE_LABELS: Record<string, string> = {
  new_construction: 'New Construction',
  vegetation_loss:  'Vegetation Loss',
  new_water:        'New Water Body',
  encroachment:     'Encroachment',
}

function DropZone({ badge, label, file, onFile }: { badge: string; label: string; file: File | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const url = file ? URL.createObjectURL(file) : null

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
      className="relative border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[200px] flex items-center justify-center"
      style={{
        borderColor: drag ? '#d29922' : file ? '#3fb950' : '#30363d',
        background: drag ? 'rgba(210,153,34,0.04)' : file ? 'rgba(63,185,80,0.04)' : '#0d1117',
      }}
    >
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff" className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}/>

      {/* Badge */}
      <div className="absolute top-2 left-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] bg-panel border border-border px-2 py-0.5"
          style={{ color: badge === 'BEFORE' ? '#8b949e' : '#388bfd' }}>
          {badge}
        </span>
      </div>

      {url ? (
        <>
          <img src={url} alt={label} className="w-full h-48 object-cover"/>
          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-panel/90 px-3 py-1.5">
            <span className="font-mono text-[10px] text-tx2 truncate block">{file?.name}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2.5 text-center p-8 mt-4">
          <div className="border border-border2 p-3">
            <UploadCloud size={20} style={{ color: badge === 'BEFORE' ? '#8b949e' : '#388bfd' }}/>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-tx">{label}</p>
            <p className="font-mono text-[9px] text-tx3 mt-1 uppercase tracking-widest">Drop or click to browse</p>
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

      {/* ── page header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare size={12} style={{ color: '#d29922' }}/>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">Temporal Analysis</span>
          <div className="flex-1 h-px bg-border mx-2"/>
          <span className="font-mono text-[9px] text-tx3">MOD-04</span>
        </div>
        <h1 className="text-3xl font-bold text-tx mb-2">Change Detection</h1>
        <p className="text-tx2 text-sm max-w-lg leading-relaxed">
          Upload two images of the same area at different times.
          The system detects encroachments, new construction, vegetation loss, and water body changes.
        </p>
      </div>

      {!result ? (
        <>
          {/* Drop zones */}
          <div className="grid grid-cols-2 gap-px bg-border mb-px">
            <DropZone label="Earlier image" badge="BEFORE" file={before} onFile={setBefore}/>
            <DropZone label="Recent image"  badge="AFTER"  file={after}  onFile={setAfter}/>
          </div>

          {/* GSD row */}
          <div className="flex items-center gap-3 bg-panel border border-border px-4 py-2.5 mb-px">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-tx3">GSD (m/px)</span>
            <input type="number" value={gsd} onChange={e => setGsd(parseFloat(e.target.value))}
              step={0.1} min={0.01}
              className="bg-transparent border-b border-border2 font-mono text-sm text-tx w-20 focus:outline-none focus:border-accent transition-colors pb-0.5"
              style={{ appearance: 'textfield' }}/>
          </div>

          {error && (
            <div className="flex items-center gap-2 border border-[#f85149]/40 bg-[#f85149]/08 px-4 py-2.5 mb-px">
              <AlertTriangle size={12} style={{ color: '#f85149' }}/>
              <span className="font-mono text-[10px] text-[#f85149]">{error}</span>
            </div>
          )}

          <button onClick={run} disabled={!before || !after || loading}
            className="w-full py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#d29922', color: '#07080b' }}>
            {loading
              ? <><Loader2 size={14} className="animate-spin"/>Analysing temporal changes…</>
              : <>Detect Changes <ArrowRight size={13}/></>}
          </button>
        </>
      ) : (
        <div className="flex gap-px bg-border">
          {/* Image viewer */}
          <div className="flex-1 min-w-0 bg-bg flex flex-col">
            <div className="flex items-center border-b border-border bg-panel">
              {(['overlay', 'comparison'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] border-r border-border transition-colors"
                  style={view === v
                    ? { color: '#d29922', borderBottom: '2px solid #d29922', background: 'rgba(210,153,34,0.06)' }
                    : { color: '#484f58', borderBottom: '2px solid transparent' }
                  }>
                  {v === 'overlay' ? 'Change Overlay' : 'Side-by-side'}
                </button>
              ))}
              <button onClick={() => setResult(null)}
                className="ml-auto px-4 font-mono text-[9px] uppercase tracking-widest text-tx3 hover:text-tx transition-colors">
                ← New Analysis
              </button>
            </div>
            <div className="bg-surface overflow-hidden">
              <img src={view === 'overlay' ? result.overlay_url : result.comparison_url}
                alt="change" className="w-full h-auto block"/>
            </div>
          </div>

          {/* Summary panel */}
          <div className="w-64 shrink-0 bg-bg flex flex-col">
            <div className="px-4 py-3 border-b border-border bg-panel">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-tx2">Change Summary</span>
            </div>
            <div className="p-4">
              <div className="flex items-end gap-2 mb-5">
                <span className="font-mono text-4xl font-bold text-tx">{result.total_changes}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-tx3 mb-1">changes</span>
              </div>

              <div className="flex flex-col gap-px bg-border">
                {Object.entries(result.change_summary).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2.5 bg-panel px-3 py-2.5">
                    <span className="w-2 h-2 shrink-0" style={{ background: CHANGE_COLORS[type] ?? '#8b949e' }}/>
                    <span className="font-mono text-[10px] text-tx2 flex-1">{CHANGE_LABELS[type] ?? type}</span>
                    <span className="font-mono text-[11px] font-bold text-tx">{count as number}</span>
                  </div>
                ))}
                {result.total_changes === 0 && (
                  <div className="bg-panel px-3 py-4 text-center">
                    <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">No changes detected</span>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 mb-2">Legend</div>
                {Object.entries(CHANGE_LABELS).map(([type, label]) => (
                  <div key={type} className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 shrink-0" style={{ background: CHANGE_COLORS[type] }}/>
                    <span className="font-mono text-[9px] text-tx3">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
