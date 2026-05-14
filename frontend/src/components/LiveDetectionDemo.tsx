import { useEffect, useRef, useState } from 'react'

const DETECTIONS = [
  { id: 1, label: 'Building',    conf: 0.94, color: '#dc3545', top: '8%',  left: '8%',  w: '22%', h: '18%' },
  { id: 2, label: 'Building',    conf: 0.91, color: '#dc3545', top: '6%',  left: '65%', w: '20%', h: '20%' },
  { id: 3, label: 'Tree Cluster',conf: 0.88, color: '#22863a', top: '38%', left: '58%', w: '22%', h: '24%' },
  { id: 4, label: 'Water Body',  conf: 0.93, color: '#1f6feb', top: '64%', left: '12%', w: '28%', h: '20%' },
  { id: 5, label: 'Road',        conf: 0.86, color: '#8b949e', top: '46%', left: '5%',  w: '90%', h: '7%'  },
  { id: 6, label: 'Park',        conf: 0.83, color: '#28a745', top: '60%', left: '52%', w: '30%', h: '28%' },
  { id: 7, label: 'Drain',       conf: 0.78, color: '#e36209', top: '28%', left: '30%', w: '5%',  h: '22%' },
]

export default function LiveDetectionDemo() {
  const [scanPct, setScanPct] = useState(0)
  const [visibleIds, setVisibleIds] = useState<number[]>([])
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const SCAN_MS = 2200

  const restart = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setVisibleIds([])
    setScanPct(0)
    setPhase('scanning')
    startRef.current = null
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const pct = Math.min(1, (ts - startRef.current) / SCAN_MS)
      setScanPct(pct)
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setPhase('done')
        DETECTIONS.forEach((d, i) => {
          setTimeout(() => setVisibleIds(p => [...p, d.id]), i * 280)
        })
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const t = setTimeout(restart, 600)
    return () => {
      clearTimeout(t)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Auto-restart loop
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(restart, 4500)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/60">

      {/* ── Satellite base (SVG terrain) ── */}
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="grain">
            <feTurbulence type="turbulence" baseFrequency="0.9" numOctaves="4" result="noise"/>
            <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
            <feBlend in="SourceGraphic" in2="gray" mode="soft-light" result="blend"/>
            <feComposite in="blend" in2="SourceGraphic" operator="in"/>
          </filter>
          <radialGradient id="vg1" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#2d5a27"/>
            <stop offset="100%" stopColor="#1a3a14"/>
          </radialGradient>
          <radialGradient id="wg1" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#1e4d7a"/>
            <stop offset="100%" stopColor="#0d2b4a"/>
          </radialGradient>
        </defs>

        {/* Base terrain */}
        <rect width="400" height="300" fill="#2e2922"/>

        {/* Road grid */}
        <rect x="0"   y="136" width="400" height="7"  fill="#484038" rx="1"/>
        <rect x="0"   y="162" width="400" height="4"  fill="#403830" rx="1"/>
        <rect x="178" y="0"   width="6"   height="300" fill="#484038" rx="1"/>
        <rect x="118" y="0"   width="3"   height="300" fill="#3a3228" rx="1"/>
        <rect x="280" y="0"   width="4"   height="300" fill="#403830" rx="1"/>

        {/* Building clusters */}
        {[[30,25,18,14],[52,22,22,18],[75,28,16,12],[30,45,20,16],
          [262,22,18,15],[285,18,24,20],[310,25,16,14],[262,48,22,18],
          [140,60,12,10],[155,55,14,12],[170,62,10,9]].map(([x,y,w,h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h}
            fill={`rgb(${110 + (i*7)%40},${100+(i*5)%30},${88+(i*3)%25})`} rx="1"/>
        ))}

        {/* Vegetation blobs */}
        <ellipse cx="285" cy="185" rx="55" ry="42" fill="url(#vg1)" opacity="0.9"/>
        <ellipse cx="310" cy="200" rx="35" ry="28" fill="#234a1e" opacity="0.8"/>
        <ellipse cx="268" cy="168" rx="22" ry="18" fill="#2d5a27" opacity="0.7"/>
        <ellipse cx="50"  cy="70"  rx="28" ry="22" fill="#1e3d1a" opacity="0.75"/>
        <ellipse cx="70"  cy="60"  rx="18" ry="14" fill="#2a5224" opacity="0.7"/>

        {/* Water body */}
        <ellipse cx="100" cy="220" rx="55" ry="28" fill="url(#wg1)" opacity="0.92"/>
        <ellipse cx="108" cy="224" rx="40" ry="20" fill="#1a4268" opacity="0.6"/>

        {/* Drain/channel */}
        <rect x="130" y="80"  width="5"  height="70" fill="#1c1a17" rx="2" opacity="0.85"/>

        {/* Noise overlay */}
        <rect width="400" height="300" fill="rgba(0,0,0,0.12)" filter="url(#grain)"/>

        {/* Top vignette */}
        <defs>
          <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)"/>
            <stop offset="30%" stopColor="rgba(0,0,0,0)"/>
            <stop offset="70%" stopColor="rgba(0,0,0,0)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)"/>
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#vig)"/>
      </svg>

      {/* ── Grid overlay ── */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Scan line ── */}
      {phase === 'scanning' && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: `${scanPct * 100}%` }}
        >
          <div className="h-px bg-blue-400/80 shadow-[0_0_12px_3px_rgba(96,165,250,0.6)]"/>
          <div className="h-8 bg-gradient-to-b from-blue-400/10 to-transparent -mt-1"/>
        </div>
      )}

      {/* ── Detection bounding boxes ── */}
      {DETECTIONS.map(d => (
        <div
          key={d.id}
          className="absolute transition-all duration-300"
          style={{
            top: d.top, left: d.left, width: d.w, height: d.h,
            opacity: visibleIds.includes(d.id) ? 1 : 0,
            transform: visibleIds.includes(d.id) ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          <div
            className="w-full h-full rounded-sm border-2"
            style={{ borderColor: d.color, backgroundColor: d.color + '18' }}
          />
          <div
            className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
            style={{ backgroundColor: d.color, color: '#fff' }}
          >
            {d.label} · {(d.conf * 100).toFixed(0)}%
          </div>
        </div>
      ))}

      {/* ── Status bar (top) ── */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur rounded-full px-3 py-1 text-[11px] font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${phase === 'scanning' ? 'bg-yellow-400 animate-pulse' : phase === 'done' ? 'bg-green-400' : 'bg-slate-500'}`}/>
          {phase === 'scanning' && <span className="text-yellow-300">SCANNING SECTOR 4/A…</span>}
          {phase === 'done'     && <span className="text-green-300">DETECTION COMPLETE</span>}
          {phase === 'idle'     && <span className="text-slate-400">INITIALISING…</span>}
        </div>
        <div className="ml-auto bg-black/60 backdrop-blur rounded-full px-2.5 py-1 text-[10px] text-slate-400 font-mono">
          GSD 0.30 m/px
        </div>
      </div>

      {/* ── Stats bar (bottom) ── */}
      <div className="absolute bottom-3 left-3 right-3">
        <div
          className="flex items-center gap-3 bg-black/70 backdrop-blur rounded-xl px-4 py-2.5 text-[11px] transition-all duration-500"
          style={{ opacity: phase === 'done' ? 1 : 0 }}
        >
          <span className="text-slate-400 font-mono">ASSETS DETECTED</span>
          <span className="text-white font-bold">{visibleIds.length}</span>
          <span className="ml-auto flex gap-3">
            {[['#dc3545','4 bldg'],['#22863a','2 tree'],['#1f6feb','1 water'],['#8b949e','1 road']].map(([c, t]) => (
              <span key={t} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }}/>
                <span className="text-slate-300">{t}</span>
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Corner coords */}
      <div className="absolute bottom-14 right-3 text-[9px] text-slate-500 font-mono text-right leading-tight">
        28°38'41"N<br/>77°11'9"E
      </div>
    </div>
  )
}
