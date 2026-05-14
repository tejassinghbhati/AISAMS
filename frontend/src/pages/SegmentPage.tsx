import { useState, useRef, useCallback, useEffect } from 'react'
import { UploadCloud, Loader2, ArrowRight, Layers, BarChart2, AlertCircle } from 'lucide-react'
import type { SegResult } from '../types'

export default function SegmentPage() {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDrag]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<SegResult | null>(null)
  const [error, setError]     = useState('')
  const [modelReady, setModelReady] = useState<boolean | null>(null)
  const [tab, setTab] = useState<'overlay' | 'mask'>('overlay')

  useEffect(() => {
    fetch('/api/seg/status')
      .then(r => r.json())
      .then(d => setModelReady(d.available))
      .catch(() => setModelReady(false))
  }, [])

  const pick = (f: File) => {
    setFile(f); setPreview(URL.createObjectURL(f)); setError(''); setResult(null)
  }
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) pick(f)
  }, [])

  const submit = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/segment', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Segmentation failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/8 text-xs text-emerald-400 font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
          DeepGlobe Land Cover · Trained Model
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Land Cover Segmentation</h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Pixel-level classification of satellite imagery into 7 land cover classes —
          trained on the DeepGlobe benchmark dataset (792 labelled WorldView tiles).
        </p>
      </div>

      {/* Model status banner */}
      {modelReady === false && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5"/>
          <div>
            Model not yet trained. Run:
            <code className="ml-2 bg-slate-800 px-2 py-0.5 rounded text-xs text-white">
              python train_segmentation.py --data "e:/Hackzilla 2026" --epochs 15 --batch 8
            </code>
            <span className="ml-2 text-amber-500/80 text-xs">(~35 min on RTX 2050)</span>
          </div>
        </div>
      )}

      <div className="flex gap-6 items-start">

        {/* Left: upload + result */}
        <div className="flex-1 min-w-0">

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[200px] flex items-center justify-center mb-4 group ${
              dragging   ? 'border-emerald-400 bg-emerald-500/8'
              : file     ? 'border-emerald-500/60 bg-emerald-500/5'
              : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/30'
            }`}
          >
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff"
              className="hidden" onChange={e => e.target.files?.[0] && pick(e.target.files[0])}/>
            {preview ? (
              <>
                <img src={preview} alt="preview" className="w-full h-auto max-h-72 object-contain"/>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3">
                  <span className="text-sm text-white font-medium">{file?.name}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
                  <UploadCloud size={26} className="text-emerald-400"/>
                </div>
                <div>
                  <p className="text-white font-semibold">Drop satellite image here</p>
                  <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={submit} disabled={!file || loading || !modelReady}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 mb-6">
            {loading ? <><Loader2 size={16} className="animate-spin"/>Segmenting…</> : <>Run Land Cover Segmentation <ArrowRight size={15}/></>}
          </button>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4">
              {error}
            </p>
          )}

          {/* Result viewer */}
          {result && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex gap-1 p-3 border-b border-slate-800">
                {([['overlay', 'Overlay'], ['mask', 'Seg Map']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      tab === id
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'text-slate-500 border-transparent hover:text-slate-200 hover:bg-slate-800/60'
                    }`}>{label}
                  </button>
                ))}
              </div>
              <img
                src={tab === 'overlay' ? result.overlay_url : result.seg_url}
                alt="segmentation result"
                className="w-full h-auto block"
              />
            </div>
          )}
        </div>

        {/* Right: legend + stats */}
        <div className="w-72 shrink-0 space-y-4">

          {/* Class legend */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Layers size={13} className="text-emerald-400"/> Land Cover Classes
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Urban / Built-up',  hex: '#0ea5e9', rgb: 'rgb(0,255,255)' },
                { name: 'Agriculture',       hex: '#eab308', rgb: 'rgb(255,255,0)' },
                { name: 'Rangeland',         hex: '#a855f7', rgb: 'rgb(255,0,255)' },
                { name: 'Water',             hex: '#1f6feb', rgb: 'rgb(0,0,255)'   },
                { name: 'Forest',            hex: '#22863a', rgb: 'rgb(0,255,0)'   },
                { name: 'Barren',            hex: '#94a3b8', rgb: 'rgb(255,255,255)'},
                { name: 'Background',        hex: '#1e293b', rgb: 'rgb(0,0,0)'     },
              ].map(c => (
                <div key={c.name} className="flex items-center gap-2.5 text-xs text-slate-400">
                  <span className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/10"
                    style={{ backgroundColor: c.hex }}/>
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          {/* Area breakdown */}
          {result && result.class_stats.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart2 size={13} className="text-emerald-400"/> Area Breakdown
              </h3>
              <div className="space-y-2.5">
                {result.class_stats.map(s => (
                  <div key={s.class_id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: s.hex, display: 'inline-block' }}/>
                        {s.class_name}
                      </span>
                      <span className="text-slate-400 font-mono">{s.area_pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${s.area_pct}%`, backgroundColor: s.hex }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dataset info */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5">
            <div className="text-slate-300 font-medium mb-2">Model Info</div>
            <div>Architecture: DeepLabV3-MobileNetV3</div>
            <div>Dataset: DeepGlobe Land Cover</div>
            <div>Training images: 792 pairs</div>
            <div>Resolution: 512 × 512</div>
            <div>Classes: 7 land cover types</div>
          </div>
        </div>
      </div>
    </div>
  )
}
