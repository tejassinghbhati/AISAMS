import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, MapPin, Github, Radio, Crosshair, Layers, GitCompare, FileDown, Zap } from 'lucide-react'
import HeroDetectionDemo from '../components/HeroDetectionDemo'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  space:   '#03080f',
  deep:    '#060f1e',
  mid:     '#0b1d35',
  panel:   '#0e243f',
  b1:      'rgba(0,195,255,0.10)',
  b2:      'rgba(0,195,255,0.22)',
  cyan:    '#00c3ff',
  cyanDim: 'rgba(0,195,255,0.55)',
  green:   '#00e676',
  amber:   '#ffab00',
  red:     '#ff4757',
  text:    '#c8e8f8',
  text2:   '#6ea8c8',
  text3:   '#2f5f7a',
}

// ─── Small reusable primitives ────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 justify-center mb-4">
      <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${C.cyan})` }}/>
      <span className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: C.cyan }}>{children}</span>
      <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${C.cyan}, transparent)` }}/>
    </div>
  )
}

function HudCard({ children, accent = C.cyan, className = '' }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}
      style={{ background: C.panel, border: `1px solid ${accent}22`, boxShadow: `0 0 24px ${accent}0d, inset 0 1px 0 ${accent}18` }}>
      {/* corner brackets */}
      {[['top-0 left-0 border-t border-l',''], ['top-0 right-0 border-t border-r',''], ['bottom-0 left-0 border-b border-l',''], ['bottom-0 right-0 border-b border-r','']].map(([pos], i) => (
        <div key={i} className={`absolute w-3 h-3 ${pos}`} style={{ borderColor: accent + '80' }}/>
      ))}
      {children}
    </div>
  )
}

// ─── Orbital ring + satellite dot ─────────────────────────────────────────────

function OrbitalRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
      {/* Outer ring */}
      <div className="absolute rounded-full" style={{
        width: 520, height: 520,
        border: `1px solid ${C.cyan}18`,
        animation: 'spin 40s linear infinite',
      }}>
        {/* Satellite dot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 rounded-full" style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}/>
        </div>
      </div>
      {/* Mid ring */}
      <div className="absolute rounded-full" style={{
        width: 700, height: 700,
        border: `1px dashed ${C.cyan}0d`,
        animation: 'spin 70s linear infinite reverse',
      }}/>
      {/* Inner glow */}
      <div className="absolute rounded-full" style={{
        width: 280, height: 280,
        background: `radial-gradient(circle, ${C.cyan}08 0%, transparent 70%)`,
      }}/>
    </div>
  )
}

// ─── Coordinate ticker ────────────────────────────────────────────────────────

function CoordTicker() {
  const frames = [
    '28°36′15″N  77°12′44″E',
    '19°04′58″N  72°52′31″E',
    '12°58′24″N  77°35′32″E',
    '26°50′24″N  80°56′59″E',
  ]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % frames.length), 3000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono text-[11px] tabular-nums transition-all duration-500" style={{ color: C.cyan }}>
      {frames[idx]}
    </span>
  )
}

// ─── Counter animation ────────────────────────────────────────────────────────

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = target / 40
      const t = setInterval(() => {
        start = Math.min(start + step, target)
        setVal(Math.round(start))
        if (start >= target) clearInterval(t)
      }, 30)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// ─── Scan line keyframe (injected once) ──────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes scanBeam {
        0%   { top: 0%;   opacity: 0;   }
        5%   { opacity: 1; }
        95%  { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }
      @keyframes radarSweep {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes blinkFast { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes floatUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    `}</style>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="w-full font-sans overflow-x-hidden" style={{ background: C.space, color: C.text }}>
      <GlobalStyles/>

      {/* ══════════════════════════════ HERO ═══════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">

        {/* ── Background layers ── */}
        {/* Star field */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, rgba(180,220,255,0.55) 1px, transparent 1px)`,
          backgroundSize: '120px 120px',
          opacity: 0.18,
        }}/>
        {/* Coordinate grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${C.cyan}08 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}08 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}/>
        {/* Top-center glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{
          background: `radial-gradient(ellipse at center top, ${C.cyan}14 0%, transparent 65%)`,
        }}/>
        {/* Earth atmosphere curve at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{
          background: `radial-gradient(ellipse 110% 60% at 50% 130%, ${C.cyan}20 0%, ${C.deep}88 50%, transparent 70%)`,
        }}/>

        <OrbitalRing/>

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center" style={{ animation: 'floatUp 0.8s ease forwards' }}>

          {/* Mission badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 mb-8 font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ border: `1px solid ${C.b2}`, background: `${C.cyan}0a`, color: C.cyan }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: C.green, boxShadow: `0 0 6px ${C.green}`, animation: 'blinkFast 1.4s infinite' }}/>
            Live · Indian Railways × eGov DIGIT · Hackzilla 2026
          </div>

          {/* Title */}
          <h1 className="font-display font-bold leading-none mb-1"
            style={{ fontSize: 'clamp(4rem, 12vw, 9rem)', letterSpacing: '0.06em', color: '#ffffff',
              textShadow: `0 0 60px ${C.cyan}40, 0 0 120px ${C.cyan}18` }}>
            DRISHYA
          </h1>
          <p className="font-mono text-[11px] tracking-[0.55em] uppercase mb-3" style={{ color: C.text2 }}>
            दृश्य &nbsp;·&nbsp; Orbital Asset Intelligence
          </p>

          {/* Live telemetry strip */}
          <div className="flex items-center gap-4 px-5 py-2 mb-8 font-mono text-[10px]"
            style={{ border: `1px solid ${C.b1}`, background: `${C.deep}cc` }}>
            <span style={{ color: C.text3 }}>COORD</span>
            <CoordTicker/>
            <div className="w-px h-3 mx-1" style={{ background: C.b2 }}/>
            <span style={{ color: C.text3 }}>ALT</span>
            <span style={{ color: C.amber }}>513 KM</span>
            <div className="w-px h-3 mx-1" style={{ background: C.b2 }}/>
            <span style={{ color: C.text3 }}>SIG</span>
            <span style={{ color: C.green }}>████████ 98%</span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed max-w-lg mb-10" style={{ color: C.text2, fontFamily: 'Inter, sans-serif' }}>
            AI-powered spatial asset intelligence — detect buildings, encroachments, water bodies
            and terrain cover from any satellite or drone image in under a second.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 mb-16">
            <button onClick={() => nav('/detect')}
              className="flex items-center gap-2 px-8 py-3 font-display font-semibold text-sm tracking-wider uppercase transition-all hover:scale-[1.03]"
              style={{ background: C.cyan, color: C.space, boxShadow: `0 0 28px ${C.cyan}60` }}>
              Launch Platform <ArrowRight size={14}/>
            </button>
            <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-8 py-3 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors"
              style={{ border: `1px solid ${C.b2}`, color: C.text2, background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.cyan)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.b2)}>
              Mission Brief
            </button>
          </div>

          {/* Demo — HUD frame */}
          <div className="w-full max-w-3xl mx-auto relative">
            {/* Targeting corners — bigger, more visible */}
            {[
              { top: -8,    left: -8,    borderTop: `2px solid ${C.cyan}`, borderLeft: `2px solid ${C.cyan}`,  width: 28, height: 28 },
              { top: -8,    right: -8,   borderTop: `2px solid ${C.cyan}`, borderRight: `2px solid ${C.cyan}`, width: 28, height: 28 },
              { bottom: -8, left: -8,    borderBottom:`2px solid ${C.cyan}`,borderLeft: `2px solid ${C.cyan}`, width: 28, height: 28 },
              { bottom: -8, right: -8,   borderBottom:`2px solid ${C.cyan}`,borderRight:`2px solid ${C.cyan}`, width: 28, height: 28 },
            ].map((s, i) => (
              <div key={i} className="absolute pointer-events-none" style={{ ...s, position: 'absolute' }}/>
            ))}
            {/* HUD top label */}
            <div className="absolute -top-6 left-0 right-0 flex items-center justify-between px-1 z-10">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: C.cyanDim }}>LIVE FEED · ACTIVE</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: C.cyanDim }}>YOLOv8-SEG + SPECTRAL</span>
            </div>
            <div style={{ border: `1px solid ${C.b1}`, boxShadow: `0 0 40px ${C.cyan}18, 0 24px 64px rgba(0,0,0,0.6)` }}>
              <HeroDetectionDemo />
            </div>
            {/* HUD bottom label */}
            <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-between px-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: C.cyanDim }}>GSD 0.30 m/px</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: C.cyanDim }}>INDIA COVERAGE ACTIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ TELEMETRY ═══════════════════════════ */}
      <section id="stats" className="py-16 px-6 border-y" style={{ borderColor: C.b1, background: C.deep }}>
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Telemetry Readout</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              { val: 68000, suffix: '+', unit: 'KM', label: 'Rail Network Coverage', color: C.cyan,  icon: <Radio size={16}/> },
              { val: 7,     suffix: '',  unit: '',   label: 'Detection Classes',     color: C.green, icon: <Crosshair size={16}/> },
              { val: 59,    suffix: '.7%',unit: '',  label: 'mIoU Land Cover',       color: C.amber, icon: <Layers size={16}/> },
              { val: 1,     suffix: 's', unit: '<',  label: 'Inference Time',        color: '#c084fc', icon: <Zap size={16}/> },
            ].map((s, i) => (
              <HudCard key={i} accent={s.color}>
                <div className="px-5 py-5 text-center">
                  <div className="flex justify-center mb-3" style={{ color: s.color, opacity: 0.7 }}>{s.icon}</div>
                  <div className="font-display font-bold text-2xl leading-none mb-1" style={{ color: s.color }}>
                    {s.unit}{s.val < 10 ? s.val + s.suffix : <CountUp target={s.val} suffix={s.suffix}/>}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] mt-2" style={{ color: C.text3 }}>{s.label}</div>
                </div>
              </HudCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ SYSTEMS ═════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Mission Systems</SectionLabel>
          <h2 className="font-display font-bold text-3xl text-center mb-10" style={{ color: '#fff', letterSpacing: '0.05em' }}>
            Four-Module Geospatial Pipeline
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: <Crosshair size={20}/>, accent: C.cyan,    code: 'SYS-01',
                title: 'ASSET DETECTION',
                desc: 'YOLOv8-seg + HSV spectral segmentation identifies buildings, roads, water bodies, drains and vehicles from any satellite tile.' },
              { icon: <Layers size={20}/>,    accent: '#c084fc', code: 'SYS-02',
                title: 'LAND COVER MAPPING',
                desc: 'DeepLabV3-MobileNetV3 trained on 792 DeepGlobe WorldView tiles — pixel-level classification into 7 land cover classes.' },
              { icon: <FileDown size={20}/>,  accent: C.green,   code: 'SYS-03',
                title: 'GIS EXPORT',
                desc: 'Every detection geo-referenced and exported as GeoJSON — compatible with QGIS, ArcGIS and eGov DIGIT GIS modules.' },
              { icon: <GitCompare size={20}/>,accent: C.amber,   code: 'SYS-04',
                title: 'CHANGE DETECTION',
                desc: 'Temporal differencing automatically flags encroachments, new construction, vegetation loss and water body changes.' },
            ].map(m => (
              <HudCard key={m.code} accent={m.accent} className="p-6 hover:scale-[1.01] transition-transform cursor-default">
                <div className="flex items-start justify-between mb-5">
                  <div className="p-2.5" style={{ border: `1px solid ${m.accent}30`, background: `${m.accent}0c`, color: m.accent }}>
                    {m.icon}
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: C.text3 }}>{m.code}</span>
                </div>
                <h3 className="font-display font-semibold tracking-wider mb-2.5" style={{ color: m.accent, fontSize: '0.85rem', letterSpacing: '0.12em' }}>
                  {m.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.text2, fontFamily: 'Inter, sans-serif' }}>{m.desc}</p>
                <div className="mt-5 h-px" style={{ background: `linear-gradient(90deg, ${m.accent}50, transparent)` }}/>
              </HudCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ MISSION BRIEF ═══════════════════════ */}
      <section id="about" className="py-20 px-6 scroll-mt-14 border-t" style={{ borderColor: C.b1, background: C.deep }}>
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Mission Brief</SectionLabel>
          <h2 className="font-display font-bold text-3xl text-center mb-12" style={{ color: '#fff', letterSpacing: '0.05em' }}>
            Built for India's Railway Network
          </h2>

          <div className="grid lg:grid-cols-5 gap-5 mb-5">
            {/* Narrative */}
            <HudCard accent={C.cyan} className="lg:col-span-3 p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.cyan }}/>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: C.text3 }}>Operational Context</span>
              </div>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: C.text2, fontFamily: 'Inter, sans-serif' }}>
                <p>India's 68,000 km railway network manages over <strong style={{ color: C.text }}>1.2 million acres</strong> of land. Manual ground surveys are slow, expensive and leave months-long blind spots during which encroachments and structural degradation go undetected.</p>
                <p>Drishya processes satellite or drone imagery through a hybrid AI pipeline — YOLOv8-seg for object detection, DeepGlobe-trained segmentation for terrain classification — producing a fully geo-referenced asset inventory in under a second.</p>
                <p>Results export as GeoJSON for eGov DIGIT Urban Infrastructure modules, closing the loop from raw orbital imagery to actionable ground intelligence.</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {[['YOLOv8-seg',C.cyan],['DeepLabV3',C.green],['FastAPI','#c084fc'],
                  ['React+Vite',C.amber],['PyTorch','#ff6b6b'],['SpaceNet SN4',C.cyan],
                  ['DeepGlobe',C.green],['WorldView-2',C.text3]].map(([n, c]) => (
                  <span key={n} className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider"
                    style={{ border: `1px solid ${c}30`, background: `${c}0a`, color: c }}>
                    {n}
                  </span>
                ))}
              </div>
            </HudCard>

            {/* Metrics */}
            <HudCard accent={C.green} className="lg:col-span-2 overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.b1}` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green, boxShadow: `0 0 6px ${C.green}` }}/>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: C.text3 }}>Model Performance</span>
              </div>
              {[
                { label: 'Precision',  value: '99.5%', pct: 99.5, color: C.green  },
                { label: 'Recall',     value: '34.4%', pct: 34.4, color: C.amber  },
                { label: 'F1 Score',   value: '50.8%', pct: 50.8, color: C.cyan   },
                { label: 'mIoU (LC)',  value: '59.7%', pct: 59.7, color: '#c084fc'},
              ].map(m => (
                <div key={m.label} className="px-5 py-4" style={{ borderBottom: `1px solid ${C.b1}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: C.text3 }}>{m.label}</span>
                    <span className="font-display font-bold text-sm" style={{ color: m.color }}>{m.value}</span>
                  </div>
                  <div className="h-1 overflow-hidden" style={{ background: `${m.color}18` }}>
                    <div className="h-full" style={{ width: `${m.pct}%`, background: `linear-gradient(90deg, ${m.color}88, ${m.color})` }}/>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3">
                <p className="font-mono text-[9px]" style={{ color: C.text3 }}>SpaceNet SN4 · WorldView-2 · Atlanta · IoU ≥ 0.5</p>
              </div>
            </HudCard>
          </div>

          {/* Crew */}
          <HudCard accent={C.cyan}>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.b1}` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.cyan }}/>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: C.text3 }}>Mission Crew</span>
              <span className="font-mono text-[9px] ml-auto" style={{ color: C.text3 }}>Hackzilla 2026</span>
            </div>
            <div className="grid sm:grid-cols-3 divide-x" style={{ borderColor: C.b1 }}>
              {[
                { name: 'Tejas Singh Bhati', role: 'AI · Full-Stack · ML',  initials: 'TB', color: C.cyan    },
                { name: 'Team Member',       role: 'Data · GIS · Research', initials: 'TM', color: C.green   },
                { name: 'Team Member',       role: 'Backend · Infra · API', initials: 'TM', color: '#c084fc' },
              ].map((t, i) => (
                <div key={i} className="px-6 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 font-display font-bold text-sm"
                    style={{ border: `1px solid ${t.color}40`, background: `${t.color}12`, color: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm tracking-wide" style={{ color: C.text }}>{t.name}</div>
                    <div className="font-mono text-[9px] mt-0.5 uppercase tracking-wider" style={{ color: C.text3 }}>{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </HudCard>
        </div>
      </section>

      {/* ══════════════════════════════ COMM CHANNEL ════════════════════════ */}
      <section id="contact" className="py-20 px-6 scroll-mt-14">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Comm Channel</SectionLabel>
          <h2 className="font-display font-bold text-3xl text-center mb-3" style={{ color: '#fff', letterSpacing: '0.05em' }}>
            Establish Contact
          </h2>
          <p className="text-center text-sm mb-12" style={{ color: C.text2, fontFamily: 'Inter, sans-serif' }}>
            Interested in deploying Drishya for a railway division, municipal body or research project?
          </p>

          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 flex flex-col gap-4">
              {[
                { icon: <Mail size={14}/>,   label: 'Signal Address', value: 'tejassinghbhati077@gmail.com', color: C.cyan    },
                { icon: <Github size={14}/>,  label: 'Repository',     value: 'tejassinghbhati/AISAMS',       color: '#c084fc' },
                { icon: <MapPin size={14}/>,  label: 'Base of Ops',    value: 'India · eGov DIGIT Platform',  color: C.green   },
              ].map(c => (
                <HudCard key={c.label} accent={c.color} className="px-5 py-4 flex items-center gap-4">
                  <div className="p-2.5 shrink-0" style={{ border: `1px solid ${c.color}30`, background: `${c.color}0d`, color: c.color }}>
                    {c.icon}
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: C.text3 }}>{c.label}</div>
                    <div className="font-mono text-[10px]" style={{ color: C.text }}>{c.value}</div>
                  </div>
                </HudCard>
              ))}
            </div>
            <div className="lg:col-span-3">
              <CommForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6" style={{ borderTop: `1px solid ${C.b1}`, background: C.deep }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green, boxShadow: `0 0 6px ${C.green}`, animation: 'blinkFast 1.4s infinite' }}/>
            <span className="font-display font-bold tracking-widest text-sm" style={{ color: '#fff' }}>DRISHYA</span>
            <span className="font-mono text-[9px] ml-1" style={{ color: C.text3 }}>· दृश्य · Orbital Intelligence</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: C.text3 }}>
            Hackzilla 2026 · Indian Railways × eGov DIGIT
          </span>
        </div>
      </footer>
    </div>
  )
}

// ─── Contact form ─────────────────────────────────────────────────────────────

function CommForm() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  if (sent) {
    return (
      <HudCard accent={C.green} className="h-full flex flex-col items-center justify-center gap-3 p-14">
        <div className="w-10 h-10 flex items-center justify-center" style={{ border: `1px solid ${C.green}40`, background: `${C.green}12` }}>
          <span style={{ color: C.green, fontSize: 20 }}>✓</span>
        </div>
        <p className="font-display font-bold tracking-widest text-sm" style={{ color: C.green }}>TRANSMISSION SENT</p>
        <p className="font-mono text-[10px] text-center" style={{ color: C.text3 }}>We'll respond on secure channel shortly.</p>
      </HudCard>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.space,
    border: `1px solid ${C.b2}`,
    padding: '10px 14px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    color: C.text,
    outline: 'none',
  }

  return (
    <HudCard accent={C.cyan} className="p-6">
      <form onSubmit={e => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-4">
        {[
          { id: 'name',  label: 'CALLSIGN',       type: 'text',  ph: 'Your name'        },
          { id: 'email', label: 'SIGNAL ADDRESS',  type: 'email', ph: 'you@example.com'  },
        ].map(f => (
          <div key={f.id}>
            <label className="block font-mono text-[9px] uppercase tracking-[0.3em] mb-1.5" style={{ color: C.text3 }} htmlFor={f.id}>
              {f.label}
            </label>
            <input id={f.id} type={f.type} required placeholder={f.ph}
              value={form[f.id as 'name' | 'email']}
              onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = C.cyan)}
              onBlur={e => (e.target.style.borderColor = C.b2)}/>
          </div>
        ))}
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.3em] mb-1.5" style={{ color: C.text3 }} htmlFor="message">
            MESSAGE BODY
          </label>
          <textarea id="message" required rows={4} placeholder="Describe your mission requirements…"
            value={form.message}
            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => (e.target.style.borderColor = C.cyan)}
            onBlur={e => (e.target.style.borderColor = C.b2)}/>
        </div>
        <button type="submit"
          className="w-full py-3.5 font-display font-bold tracking-[0.25em] uppercase text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          style={{ background: C.cyan, color: C.space, boxShadow: `0 0 24px ${C.cyan}50` }}>
          Transmit <ArrowRight size={14}/>
        </button>
      </form>
    </HudCard>
  )
}
