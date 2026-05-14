import { useEffect, useRef, useState } from 'react'
import { catColor } from './CategoryFilter'
import LiveDetectionDemo from './LiveDetectionDemo'
import type { Detection, DetectionResult } from '../types'

const C = 9  // corner bracket size px (CSS-based, relative)

function CornerBox({
  color, label, conf, box, imgW, imgH, visible,
}: {
  color: string; label: string; conf: number
  box: { x: number; y: number; w: number; h: number }
  imgW: number; imgH: number; visible: boolean
}) {
  const left   = (box.x / imgW) * 100
  const top    = (box.y / imgH) * 100
  const width  = (box.w / imgW) * 100
  const height = (box.h / imgH) * 100

  return (
    <div className="absolute transition-all duration-300 pointer-events-none"
      style={{
        left: `${left}%`, top: `${top}%`,
        width: `${width}%`, height: `${height}%`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'scale(0.96)',
      }}>
      {/* Corner brackets */}
      {[
        { top: 0, left: 0,    borderTop: `1.5px solid ${color}`, borderLeft:  `1.5px solid ${color}` },
        { top: 0, right: 0,   borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
        { bottom: 0, left: 0, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
        { bottom: 0, right: 0,borderBottom: `1.5px solid ${color}`, borderRight:`1.5px solid ${color}` },
      ].map((s, i) => (
        <div key={i} className="absolute" style={{ ...s, width: C, height: C }}/>
      ))}
      {/* Label */}
      <div className="absolute font-mono whitespace-nowrap px-1 pointer-events-none"
        style={{
          top: -15, left: 0, fontSize: 8, lineHeight: '13px',
          color, background: 'rgba(7,8,11,0.88)',
          borderLeft: `1.5px solid ${color}`,
        }}>
        {label.toUpperCase()} · {(conf * 100).toFixed(0)}%
      </div>
    </div>
  )
}

type Phase = 'idle' | 'fetching' | 'scanning' | 'done' | 'error'

export default function HeroDetectionDemo() {
  const [phase, setPhase]         = useState<Phase>('idle')
  const [imgUrl, setImgUrl]       = useState<string | null>(null)
  const [imgSize, setImgSize]     = useState({ w: 1, h: 1 })
  const [detections, setDets]     = useState<Detection[]>([])
  const [visible, setVisible]     = useState<string[]>([])
  const [scanPct, setScanPct]     = useState(0)
  const [stats, setStats]         = useState<{ total: number; label: string } | null>(null)
  const [useFallback, setFallback] = useState(false)

  const rafRef   = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const SCAN_MS  = 2200

  const runScan = (dets: Detection[]) => {
    setVisible([]); setScanPct(0); setPhase('scanning'); startRef.current = null
    const go = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min(1, (ts - startRef.current) / SCAN_MS)
      setScanPct(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(go)
      } else {
        setPhase('done')
        // staggered reveal
        dets.forEach((d, i) =>
          setTimeout(() => setVisible(v => [...v, d.id]), i * 120)
        )
      }
    }
    rafRef.current = requestAnimationFrame(go)
  }

  const fetchAndRun = async () => {
    setPhase('fetching')
    try {
      const samplesRes = await fetch('/api/samples', { signal: AbortSignal.timeout(4000) })
      if (!samplesRes.ok) throw new Error('samples unavailable')
      const { samples } = await samplesRes.json()
      const sample = (samples as Array<{ file: string; url: string; available: boolean }>)
        .find(s => s.available)
      if (!sample) throw new Error('no samples ready')

      setImgUrl(sample.url)

      const detectRes = await fetch(`/api/samples/${sample.file}/detect`, {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
      })
      if (!detectRes.ok) throw new Error('detection failed')
      const result: DetectionResult = await detectRes.json()

      setImgSize({ w: result.image_width, h: result.image_height })
      // limit to 12 boxes max so the hero doesn't get crowded
      const dets = result.detections.slice(0, 12)
      setDets(dets)
      setStats({ total: result.summary.total, label: sample.file.replace(/_/g,' ').replace('.jpg','').replace('.png','') })
      runScan(dets)
    } catch {
      setFallback(true)
      setPhase('error')
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchAndRun, 400)
    return () => {
      clearTimeout(t)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // restart loop
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(() => {
      setVisible([])
      setScanPct(0)
      if (detections.length > 0) runScan(detections)
    }, 5000)
    return () => clearTimeout(t)
  }, [phase])

  if (useFallback) return <LiveDetectionDemo />

  // Loading state while fetching
  if (!imgUrl || phase === 'idle' || phase === 'fetching') {
    return (
      <div className="relative w-full aspect-[4/3] border border-border2 overflow-hidden bg-surface flex flex-col items-center justify-center gap-3">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(56,139,253,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(56,139,253,0.04) 1px,transparent 1px)',
            backgroundSize: '32px 32px',
          }}/>
        <div className="w-5 h-5 border-2 border-accent border-t-transparent animate-spin"/>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">
          {phase === 'fetching' ? 'Running Detection…' : 'Initialising…'}
        </span>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[4/3] border border-border2 overflow-hidden bg-surface">

      {/* Real satellite image */}
      <img
        src={imgUrl}
        alt="satellite"
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={e => {
          const img = e.currentTarget
          if (imgSize.w === 1) setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
        }}
      />

      {/* Fine grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(56,139,253,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(56,139,253,0.04) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}/>

      {/* Scan line */}
      {phase === 'scanning' && (
        <div className="absolute left-0 right-0 pointer-events-none"
          style={{ top: `${scanPct * 100}%` }}>
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg,transparent,#388bfd,#60a5fa,#388bfd,transparent)',
            boxShadow: '0 0 8px 2px rgba(56,139,253,0.5)',
          }}/>
        </div>
      )}

      {/* Detection boxes */}
      {detections.map(d => (
        <CornerBox
          key={d.id}
          color={d.color || catColor(d.category)}
          label={d.category}
          conf={d.confidence}
          box={d.bbox}
          imgW={imgSize.w}
          imgH={imgSize.h}
          visible={visible.includes(d.id)}
        />
      ))}

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 border-b border-border/60 bg-bg/85 px-3 py-1.5 flex items-center gap-3">
        <span className={`w-1.5 h-1.5 inline-block ${
          phase === 'scanning' ? 'bg-[#d29922] animate-blink'
          : phase === 'done'   ? 'bg-[#3fb950]'
          : 'bg-tx3'}`}/>
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase"
          style={{ color: phase === 'scanning' ? '#d29922' : phase === 'done' ? '#3fb950' : '#484f58' }}>
          {phase === 'scanning'
            ? `SCANNING · ${(scanPct * 100).toFixed(0)}%`
            : phase === 'done' ? 'ANALYSIS COMPLETE'
            : 'READY'}
        </span>
        <span className="ml-auto font-mono text-[9px] text-tx3 tracking-wider">GSD 0.30 m/px</span>
      </div>

      {/* Bottom stats bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 bg-bg/85 px-3 py-1.5 flex items-center gap-3"
        style={{ opacity: phase === 'done' ? 1 : 0, transition: 'opacity 0.4s' }}>
        <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">DETECTED</span>
        <span className="font-mono text-[9px] font-bold text-tx">{visible.length}</span>
        {stats && (
          <>
            <div className="w-px h-3 bg-border2 mx-1"/>
            <span className="font-mono text-[9px] text-tx3 uppercase tracking-wider">{stats.total} total assets</span>
          </>
        )}
        {/* per-category mini legend */}
        <div className="ml-auto flex items-center gap-3">
          {Array.from(new Set(detections.map(d => d.category))).slice(0, 4).map(cat => (
            <span key={cat} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 inline-block" style={{ background: catColor(cat) }}/>
              <span className="font-mono text-[9px] text-tx3 uppercase">{cat.slice(0,4)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
