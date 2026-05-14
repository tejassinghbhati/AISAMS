import { useState, useRef, useCallback, useEffect } from 'react'
import { UploadCloud, Loader2, ArrowRight, Layers, BarChart2, AlertCircle } from 'lucide-react'
import type { SegResult } from '../types'

const CLASS_LEGEND = [
  { name: 'Urban / Built-up', hex: '#0ea5e9' },
  { name: 'Agriculture',      hex: '#eab308' },
  { name: 'Rangeland',        hex: '#a855f7' },
  { name: 'Water',            hex: '#1f6feb' },
  { name: 'Forest',           hex: '#22863a' },
  { name: 'Barren',           hex: '#94a3b8' },
  { name: 'Background',       hex: '#1e293b' },
]

export default function SegmentPage() {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [file, setFile]           = useState<File | null>(null)
  const [preview, setPreview]     = useState<string | null>(null)
  const [dragging, setDrag]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<SegResult | null>(null)
  const [error, setError]         = useState('')
  const [modelReady, setModelReady] = useState<boolean | null>(null)
  const [tab, setTab]             = useState<'overlay' | 'mask'>('overlay')

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

      {/* ── page header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block"/>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">
            DeepGlobe Land Cover · Trained Model
          </span>
          <div className="flex-1 h-px bg-border mx-2"/>
          <span className="font-mono text-[9px] text-tx3">DeepLabV3-MobileNetV3</span>
        </div>
        <h1 className="text-3xl font-bold text-tx mb-2">Land Cover Segmentation</h1>
        <p className="text-tx2 text-sm max-w-xl leading-relaxed">
          Pixel-level classification into 7 land cover classes,
          trained on DeepGlobe benchmark dataset (792 labelled WorldView tiles).
        </p>
      </div>

      {/* Model not ready banner */}
      {modelReady === false && (
        <div className="mb-6 flex items-start gap-3 border border-[#d29922]/30 bg-[#d29922]/08 px-4 py-3">
          <AlertCircle size={14} style={{ color: '#d29922' }} className="shrink-0 mt-0.5"/>
          <div className="font-mono text-[10px] text-[#d29922]">
            Model not yet trained. Run:{' '}
            <code className="bg-panel px-2 py-0.5 text-tx ml-1">
              python train_segmentation.py --data "./data" --epochs 15 --batch 8
            </code>
            <span className="text-tx3 ml-2">(~35 min on RTX 2050)</span>
          </div>
        </div>
      )}

      <div className="flex gap-px bg-border items-start">

        {/* Left: upload + result */}
        <div className="flex-1 min-w-0 bg-bg flex flex-col gap-px">

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="relative border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[200px] flex items-center justify-center"
            style={{
              borderColor: dragging ? '#3fb950' : file ? '#3fb950' : '#30363d',
              background: dragging || file ? 'rgba(63,185,80,0.04)' : '#0d1117',
            }}
          >
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.tif,.tiff"
              className="hidden" onChange={e => e.target.files?.[0] && pick(e.target.files[0])}/>
            {preview ? (
              <>
                <img src={preview} alt="preview" className="w-full h-auto max-h-72 object-contain"/>
                <div className="absolute inset-x-0 bottom-0 border-t border-border bg-panel/90 px-4 py-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block"/>
                  <span className="font-mono text-[10px] text-tx2 truncate">{file?.name}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <div className="border border-border2 p-4">
                  <UploadCloud size={24} style={{ color: '#3fb950' }}/>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-tx">Drop satellite image here</p>
                  <p className="font-mono text-[9px] text-tx3 mt-1 uppercase tracking-widest">or click to browse</p>
                </div>
              </div>
            )}
          </div>

          {/* Run button */}
          <button onClick={submit} disabled={!file || loading || !modelReady}
            className="w-full py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#3fb950', color: '#07080b' }}>
            {loading
              ? <><Loader2 size={14} className="animate-spin"/>Segmenting…</>
              : <>Run Land Cover Segmentation <ArrowRight size={13}/></>}
          </button>

          {error && (
            <div className="border border-[#f85149]/40 bg-[#f85149]/08 px-4 py-2.5">
              <span className="font-mono text-[10px] text-[#f85149]">{error}</span>
            </div>
          )}

          {/* Result viewer */}
          {result && (
            <div className="bg-surface">
              <div className="flex border-b border-border bg-panel">
                {([['overlay', 'Overlay'], ['mask', 'Seg Map']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] border-r border-border transition-colors"
                    style={tab === id
                      ? { color: '#3fb950', borderBottom: '2px solid #3fb950', background: 'rgba(63,185,80,0.06)' }
                      : { color: '#484f58', borderBottom: '2px solid transparent' }
                    }>{label}
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
        <div className="w-64 shrink-0 bg-bg flex flex-col">

          {/* Class legend */}
          <div className="border-b border-border">
            <div className="flex items-center gap-2 px-4 py-3 bg-panel border-b border-border">
              <Layers size={11} style={{ color: '#3fb950' }}/>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-tx2">Land Cover Classes</span>
            </div>
            <div className="p-4 flex flex-col gap-px bg-border">
              {CLASS_LEGEND.map(c => (
                <div key={c.name} className="flex items-center gap-2.5 bg-panel px-3 py-2">
                  <span className="w-3 h-3 shrink-0 border border-border2" style={{ backgroundColor: c.hex }}/>
                  <span className="font-mono text-[10px] text-tx2">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Area breakdown */}
          {result && result.class_stats.length > 0 && (
            <div className="border-b border-border">
              <div className="flex items-center gap-2 px-4 py-3 bg-panel border-b border-border">
                <BarChart2 size={11} style={{ color: '#3fb950' }}/>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-tx2">Area Breakdown</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {result.class_stats.map(s => (
                  <div key={s.class_id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 shrink-0" style={{ backgroundColor: s.hex }}/>
                        <span className="font-mono text-[10px] text-tx2">{s.class_name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-tx3">{s.area_pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-px bg-border overflow-hidden">
                      <div className="h-full transition-all duration-700"
                        style={{ width: `${s.area_pct}%`, backgroundColor: s.hex }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model info */}
          <div className="p-4">
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 mb-3">Model Info</div>
            <div className="flex flex-col gap-px bg-border">
              {[
                ['Architecture', 'DeepLabV3-MobileNetV3'],
                ['Dataset',      'DeepGlobe Land Cover'],
                ['Train images', '792 pairs'],
                ['Resolution',   '512 × 512'],
                ['Classes',      '7 land cover types'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between bg-panel px-3 py-2">
                  <span className="font-mono text-[9px] text-tx3 uppercase tracking-wider">{k}</span>
                  <span className="font-mono text-[9px] text-tx2">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
