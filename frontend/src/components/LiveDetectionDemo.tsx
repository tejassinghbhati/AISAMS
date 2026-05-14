import { useEffect, useRef, useState } from 'react'

const DETECTIONS = [
  { id: 1, label: 'BUILDING',     conf: 0.94, color: '#f85149', top: 8,  left: 8,  w: 22, h: 19 },
  { id: 2, label: 'BUILDING',     conf: 0.91, color: '#f85149', top: 6,  left: 65, w: 21, h: 21 },
  { id: 3, label: 'TREE CLUSTER', conf: 0.88, color: '#3fb950', top: 38, left: 58, w: 24, h: 26 },
  { id: 4, label: 'WATER BODY',   conf: 0.93, color: '#388bfd', top: 64, left: 11, w: 30, h: 22 },
  { id: 5, label: 'ROAD',         conf: 0.86, color: '#8b949e', top: 45, left: 4,  w: 92, h:  8 },
  { id: 6, label: 'PARK',         conf: 0.82, color: '#3fb950', top: 60, left: 52, w: 32, h: 30 },
  { id: 7, label: 'DRAIN',        conf: 0.77, color: '#d29922', top: 26, left: 30, w:  6, h: 24 },
]

function CornerBox({ color, label, conf, top, left, w, h, visible }: {
  color: string; label: string; conf: number
  top: number; left: number; w: number; h: number; visible: boolean
}) {
  const C = 8
  return (
    <div className="absolute transition-all duration-300"
      style={{
        top: `${top}%`, left: `${left}%`, width: `${w}%`, height: `${h}%`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'scale(0.96)',
      }}>
      {/* Corner brackets */}
      {[
        { top: 0,    left: 0,    borderTop: `1.5px solid ${color}`, borderLeft:  `1.5px solid ${color}` },
        { top: 0,    right: 0,   borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
        { bottom: 0, left: 0,    borderBottom: `1.5px solid ${color}`, borderLeft:  `1.5px solid ${color}` },
        { bottom: 0, right: 0,   borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
      ].map((s, i) => (
        <div key={i} className="absolute" style={{ ...s, width: C, height: C }} />
      ))}
      {/* Label */}
      <div className="absolute font-mono whitespace-nowrap px-1"
        style={{
          top: -16, left: 0, fontSize: 8, lineHeight: '14px',
          color, background: 'rgba(7,8,11,0.85)',
          borderLeft: `1.5px solid ${color}`,
        }}>
        {label} · {(conf * 100).toFixed(0)}%
      </div>
    </div>
  )
}

export default function LiveDetectionDemo() {
  const [scanPct, setScanPct]   = useState(0)
  const [visible, setVisible]   = useState<number[]>([])
  const [phase, setPhase]       = useState<'idle' | 'scanning' | 'done'>('idle')
  const rafRef   = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const SCAN_MS  = 2400

  const restart = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setVisible([]); setScanPct(0); setPhase('scanning'); startRef.current = null
    const go = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min(1, (ts - startRef.current) / SCAN_MS)
      setScanPct(p)
      if (p < 1) { rafRef.current = requestAnimationFrame(go) }
      else {
        setPhase('done')
        DETECTIONS.forEach((d, i) => setTimeout(() => setVisible(v => [...v, d.id]), i * 240))
      }
    }
    rafRef.current = requestAnimationFrame(go)
  }

  useEffect(() => {
    const t = setTimeout(restart, 500)
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(restart, 4200)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="relative w-full aspect-[4/3] border border-border2 overflow-hidden bg-surface">

      {/* Terrain base */}
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="g">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="n"/>
            <feColorMatrix type="saturate" values="0" in="n" result="gn"/>
            <feBlend in="SourceGraphic" in2="gn" mode="soft-light"/>
          </filter>
          <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a3318"/>
            <stop offset="100%" stopColor="#0f2010"/>
          </linearGradient>
          <radialGradient id="wg">
            <stop offset="0%" stopColor="#112840"/>
            <stop offset="100%" stopColor="#091820"/>
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill="#121810"/>
        {/* Road grid */}
        <rect x="0"   y="133" width="400" height="8"  fill="#1c1a14"/>
        <rect x="0"   y="160" width="400" height="4"  fill="#181610"/>
        <rect x="175" y="0"   width="7"   height="300" fill="#1c1a14"/>
        <rect x="116" y="0"   width="4"   height="300" fill="#181610"/>
        <rect x="278" y="0"   width="5"   height="300" fill="#181610"/>
        {/* Buildings */}
        {[[30,25,18,14,0],[52,22,22,18,1],[75,28,16,12,2],[30,45,20,16,3],
          [262,22,18,15,4],[285,18,24,20,5],[310,25,16,14,6],[262,48,22,18,7]].map(([x,y,w,h,i]) => (
          <rect key={i} x={x} y={y} width={w} height={h}
            fill={`hsl(${38 + i*2},${8+i}%,${34+i*2}%)`}/>
        ))}
        {/* Vegetation */}
        <ellipse cx="285" cy="185" rx="54" ry="42" fill="url(#vg)" opacity="0.92"/>
        <ellipse cx="52"  cy="68"  rx="27" ry="21" fill="#142a12" opacity="0.85"/>
        {/* Water */}
        <ellipse cx="100" cy="220" rx="54" ry="27" fill="url(#wg)" opacity="0.94"/>
        {/* Drain */}
        <rect x="128" y="80" width="5" height="68" fill="#0c0c0a" opacity="0.9"/>
        {/* Noise */}
        <rect width="400" height="300" fill="rgba(0,0,0,0.15)" filter="url(#g)"/>
        {/* Vignette */}
        <defs>
          <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(7,8,11,0.6)"/>
            <stop offset="20%"  stopColor="rgba(7,8,11,0)"/>
            <stop offset="80%"  stopColor="rgba(7,8,11,0)"/>
            <stop offset="100%" stopColor="rgba(7,8,11,0.7)"/>
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#vig)"/>
      </svg>

      {/* Fine grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(56,139,253,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(56,139,253,0.04) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}/>

      {/* Scan line */}
      {phase === 'scanning' && (
        <div className="absolute left-0 right-0 pointer-events-none"
          style={{ top: `${scanPct * 100}%`, transition: 'top 16ms linear' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#388bfd,#60a5fa,#388bfd,transparent)', boxShadow: '0 0 8px 2px rgba(56,139,253,0.5)' }}/>
        </div>
      )}

      {/* Detection boxes */}
      {DETECTIONS.map(d => (
        <CornerBox key={d.id} {...d} visible={visible.includes(d.id)} />
      ))}

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 border-b border-border/60 bg-bg/80 px-3 py-1.5 flex items-center gap-3">
        <span className={`w-1.5 h-1.5 inline-block ${phase === 'scanning' ? 'bg-yellow-400 animate-blink' : phase === 'done' ? 'bg-[#3fb950]' : 'bg-tx3'}`}/>
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase"
          style={{ color: phase === 'scanning' ? '#d29922' : phase === 'done' ? '#3fb950' : '#484f58' }}>
          {phase === 'scanning' ? `SCANNING · ${(scanPct * 100).toFixed(0)}%` : phase === 'done' ? 'ANALYSIS COMPLETE' : 'INITIALISING'}
        </span>
        <span className="ml-auto font-mono text-[9px] text-tx3 tracking-wider">GSD 0.30 m/px</span>
      </div>

      {/* Bottom stats bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 bg-bg/80 px-3 py-1.5 flex items-center gap-3"
        style={{ opacity: phase === 'done' ? 1 : 0, transition: 'opacity 0.4s' }}>
        <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">ASSETS</span>
        <span className="font-mono text-[9px] font-bold text-tx">{visible.length}</span>
        <div className="w-px h-3 bg-border2 mx-1"/>
        {[['#f85149','BLDG:4'],['#3fb950','TREE:2'],['#388bfd','H₂O:1'],['#8b949e','ROAD:1']].map(([c,t]) => (
          <span key={t} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 inline-block" style={{ background: c }}/>
            <span className="font-mono text-[9px] text-tx3">{t}</span>
          </span>
        ))}
        <span className="ml-auto font-mono text-[9px] text-tx3">28°38′N 77°11′E</span>
      </div>
    </div>
  )
}
