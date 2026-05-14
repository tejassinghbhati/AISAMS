import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Map, GitCompare, Crosshair, Mail, MapPin, Github, ChevronDown } from 'lucide-react'
import HeroDetectionDemo from '../components/HeroDetectionDemo'

const MODULES = [
  {
    code: '01', accent: '#388bfd', icon: <Crosshair size={15}/>,
    title: 'Asset Detection',
    desc: 'YOLOv8-seg + HSV spectral segmentation identifies buildings, trees, water bodies, drains, roads and vehicles in under a second.',
  },
  {
    code: '02', accent: '#a371f7', icon: <Zap size={15}/>,
    title: 'Land Cover Mapping',
    desc: 'DeepLabV3-MobileNetV3 trained on 792 DeepGlobe WorldView tiles — pixel-level classification across 7 land cover classes.',
  },
  {
    code: '03', accent: '#3fb950', icon: <Map size={15}/>,
    title: 'GIS Export',
    desc: 'Every detection geo-referenced and exported as standards-compliant GeoJSON — ready for QGIS, ArcGIS or eGov DIGIT GIS modules.',
  },
  {
    code: '04', accent: '#d29922', icon: <GitCompare size={15}/>,
    title: 'Change Detection',
    desc: 'Temporal differencing automatically flags new construction, encroachments, vegetation loss and water body changes between acquisitions.',
  },
]

const STATS = [
  { value: '68K+',   label: 'km of rail network' },
  { value: '7',      label: 'detection classes'  },
  { value: '59.7%',  label: 'mIoU land cover'    },
  { value: '<1s',    label: 'inference time'      },
]

const TEAM = [
  { name: 'Tejas Singh Bhati', role: 'AI · Full-Stack · ML',  initials: 'TB', color: '#388bfd' },
  { name: 'Team Member',       role: 'Data · GIS · Research', initials: 'TM', color: '#3fb950' },
  { name: 'Team Member',       role: 'Backend · Infra · API', initials: 'TM', color: '#a371f7' },
]

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="w-full">

      {/* ═══════════════════════════════ HERO ═════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-44px)] flex flex-col items-center justify-center border-b border-border overflow-hidden px-5 py-20">

        {/* Background — radial glow + grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(56,139,253,0.06) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}/>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-20"
            style={{ background: 'radial-gradient(ellipse at center, rgba(56,139,253,0.35) 0%, transparent 70%)' }}/>
        </div>

        {/* ── Eyebrow ── */}
        <div className="relative flex items-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block animate-blink"/>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-tx3">
            Indian Railways × eGov DIGIT Platform · Hackzilla 2026
          </span>
        </div>

        {/* ── Title ── */}
        <div className="relative text-center mb-4">
          <h1 className="text-[5.5rem] sm:text-[7rem] lg:text-[8.5rem] font-bold leading-none tracking-tight text-tx"
            style={{ letterSpacing: '-0.03em' }}>
            Drishya
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-tx3 mt-2">
            दृश्य &nbsp;·&nbsp; Vision from Above
          </p>
        </div>

        {/* ── Description ── */}
        <p className="relative text-center text-tx2 text-base leading-relaxed max-w-xl mb-10">
          AI-powered spatial asset intelligence for India's 68,000 km railway network.
          Detect buildings, encroachments, water bodies and more from any satellite image — in under a second.
        </p>

        {/* ── CTAs ── */}
        <div className="relative flex items-center gap-3 mb-14">
          <button onClick={() => nav('/detect')}
            className="flex items-center gap-2 px-8 py-3 bg-accent font-mono text-[11px] uppercase tracking-[0.2em] font-semibold text-[#07080b] hover:opacity-90 transition-opacity">
            Start Detection <ArrowRight size={13}/>
          </button>
          <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-8 py-3 border border-border font-mono text-[11px] uppercase tracking-[0.2em] text-tx2 hover:text-tx hover:border-border2 transition-colors">
            Learn More
          </button>
        </div>

        {/* ── Live demo panel ── */}
        <div className="relative w-full max-w-3xl mx-auto">
          {/* Corner decorators */}
          {[
            'absolute -top-px -left-px border-t-2 border-l-2 border-accent/50 w-5 h-5',
            'absolute -top-px -right-px border-t-2 border-r-2 border-accent/50 w-5 h-5',
            'absolute -bottom-px -left-px border-b-2 border-l-2 border-accent/50 w-5 h-5',
            'absolute -bottom-px -right-px border-b-2 border-r-2 border-accent/50 w-5 h-5',
          ].map((c, i) => <div key={i} className={c}/>)}
          <HeroDetectionDemo />
        </div>

        {/* ── Scroll hint ── */}
        <button
          onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
          className="relative mt-10 flex flex-col items-center gap-1.5 text-tx3 hover:text-tx2 transition-colors">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em]">Scroll</span>
          <ChevronDown size={14} className="animate-bounce"/>
        </button>
      </section>

      {/* ═════════════════════════════ STATS STRIP ════════════════════════════ */}
      <section id="stats" className="border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-px bg-border">
            {STATS.map(s => (
              <div key={s.label} className="flex-1 bg-surface px-6 py-5 text-center">
                <div className="font-mono text-2xl font-bold text-tx mb-1">{s.value}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx3">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════ MODULES ═══════════════════════════════ */}
      <section className="border-b border-border py-20 px-5">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-border2"/>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-tx3">What Drishya Does</span>
              <div className="h-px w-8 bg-border2"/>
            </div>
            <h2 className="text-2xl font-bold text-tx">Four-module geospatial pipeline</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-border">
            {MODULES.map(m => (
              <div key={m.code} className="bg-surface p-7 group hover:bg-panel transition-colors">
                <div className="flex items-start justify-between mb-5">
                  <div className="p-2 border" style={{ borderColor: m.accent + '35', color: m.accent, background: m.accent + '0c' }}>
                    {m.icon}
                  </div>
                  <span className="font-mono text-[9px] text-tx3 border border-border px-2 py-0.5">{m.code}</span>
                </div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-tx mb-2.5">{m.title}</h3>
                <p className="text-tx3 text-[12px] leading-relaxed">{m.desc}</p>
                <div className="mt-5 h-px" style={{ background: `linear-gradient(90deg, ${m.accent}40, transparent)` }}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════ ABOUT ══════════════════════════════════ */}
      <section id="about" className="border-b border-border py-20 px-5 scroll-mt-11">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-border2"/>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-tx3">About the Project</span>
              <div className="h-px w-8 bg-border2"/>
            </div>
            <h2 className="text-2xl font-bold text-tx mb-3">Built for India's Railway Network</h2>
            <p className="text-tx2 text-sm max-w-xl mx-auto leading-relaxed">
              Drishya automates the detection and monitoring of spatial assets across
              India's railway land — helping railway divisions and municipalities
              act on ground truth before issues escalate.
            </p>
          </div>

          {/* Two-col: narrative + metrics */}
          <div className="grid lg:grid-cols-5 gap-6 mb-10">

            {/* Narrative — 3 cols */}
            <div className="lg:col-span-3 border border-border bg-surface p-6">
              <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-tx3 mb-5 flex items-center gap-2">
                <span className="w-1 h-1 bg-accent inline-block"/>
                Mission
              </div>
              <div className="space-y-3.5 text-tx2 text-sm leading-relaxed">
                <p>
                  India's 68,000 km railway network manages over
                  <span className="text-tx font-medium"> 1.2 million acres</span> of land.
                  Manual surveys are slow, expensive and leave months-long gaps during which
                  encroachments and structural problems go undetected.
                </p>
                <p>
                  Drishya processes satellite, aerial or drone imagery through a hybrid pipeline —
                  YOLOv8-seg for object-level detection, DeepGlobe land-cover segmentation for
                  terrain classification — producing a fully geo-referenced asset inventory in
                  under a second.
                </p>
                <p>
                  Results are exported as GeoJSON ready for eGov DIGIT's Urban Infrastructure
                  modules, closing the loop from raw satellite data to actionable ground truth.
                </p>
              </div>

              {/* Tech chips */}
              <div className="mt-6 flex flex-wrap gap-px bg-border">
                {[
                  ['YOLOv8-seg', '#388bfd'], ['DeepLabV3', '#3fb950'],
                  ['FastAPI',    '#a371f7'], ['React + Vite', '#d29922'],
                  ['PyTorch',    '#f85149'], ['SpaceNet SN4', '#388bfd'],
                  ['DeepGlobe',  '#3fb950'], ['WorldView-2',  '#8b949e'],
                ].map(([n, c]) => (
                  <div key={n} className="bg-panel px-3 py-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5" style={{ background: c }}/>
                    <span className="font-mono text-[9px] text-tx2">{n}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics — 2 cols */}
            <div className="lg:col-span-2 border border-border bg-surface">
              <div className="px-5 py-4 border-b border-border bg-panel flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block"/>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx2">Model Metrics</span>
              </div>
              <div className="flex flex-col gap-px bg-border">
                {[
                  { label: 'Precision',   value: '99.5%', color: '#3fb950', bar: 0.995 },
                  { label: 'Recall',      value: '34.4%', color: '#d29922', bar: 0.344 },
                  { label: 'F1 Score',    value: '50.8%', color: '#388bfd', bar: 0.508 },
                  { label: 'mIoU (LC)',   value: '59.7%', color: '#a371f7', bar: 0.597 },
                ].map(m => (
                  <div key={m.label} className="bg-surface px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-tx3">{m.label}</span>
                      <span className="font-mono text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
                    </div>
                    <div className="h-px bg-border overflow-hidden">
                      <div className="h-full" style={{ width: `${m.bar * 100}%`, background: m.color }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border bg-panel">
                <span className="font-mono text-[8px] text-tx3">SpaceNet SN4 · WorldView-2 · IoU ≥ 0.5</span>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="border border-border bg-surface">
            <div className="px-5 py-4 border-b border-border bg-panel flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent inline-block"/>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx2">Team</span>
              <span className="font-mono text-[9px] text-tx3 ml-auto">Hackzilla 2026</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-px bg-border">
              {TEAM.map((t, i) => (
                <div key={i} className="bg-surface px-5 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 border border-border2 flex items-center justify-center shrink-0"
                    style={{ background: t.color + '10' }}>
                    <span className="font-mono text-[11px] font-bold" style={{ color: t.color }}>{t.initials}</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-tx">{t.name}</div>
                    <div className="font-mono text-[9px] text-tx3 mt-0.5">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════ CONTACT ════════════════════════════════ */}
      <section id="contact" className="py-20 px-5 scroll-mt-11">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-border2"/>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-tx3">Contact</span>
              <div className="h-px w-8 bg-border2"/>
            </div>
            <h2 className="text-2xl font-bold text-tx mb-3">Get in Touch</h2>
            <p className="text-tx2 text-sm max-w-md mx-auto">
              Interested in deploying Drishya for a railway division, municipal body or research project?
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">

            {/* Info cards — 2 cols */}
            <div className="lg:col-span-2 flex flex-col gap-px bg-border">
              {[
                { icon: <Mail size={12}/>,   label: 'Email',    value: 'tejassinghbhati077@gmail.com', accent: '#388bfd' },
                { icon: <Github size={12}/>,  label: 'GitHub',   value: 'tejassinghbhati/AISAMS',        accent: '#a371f7' },
                { icon: <MapPin size={12}/>,  label: 'Location', value: 'India · eGov DIGIT Platform',   accent: '#3fb950' },
              ].map(c => (
                <div key={c.label} className="bg-surface px-5 py-5 flex items-start gap-4">
                  <div className="p-2 border border-border mt-0.5" style={{ color: c.accent }}>
                    {c.icon}
                  </div>
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 mb-1">{c.label}</div>
                    <div className="font-mono text-[10px] text-tx leading-tight">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form — 3 cols */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div className="border-t border-border py-5 px-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">
            Drishya · दृश्य · Hackzilla 2026
          </span>
          <span className="font-mono text-[9px] text-tx3">YOLOv8 + DeepLabV3 + FastAPI + React</span>
        </div>
      </div>

    </div>
  )
}

function ContactForm() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  if (sent) {
    return (
      <div className="border border-[#3fb950]/40 h-full flex flex-col items-center justify-center gap-3 p-14"
        style={{ background: 'rgba(63,185,80,0.04)' }}>
        <span className="w-2 h-2 bg-[#3fb950] inline-block"/>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#3fb950]">Message Sent</span>
        <span className="font-mono text-[9px] text-tx3 text-center">We'll get back to you shortly.</span>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-px bg-border">
      {[
        { id: 'name',  label: 'Full Name',     type: 'text',  ph: 'Your name'       },
        { id: 'email', label: 'Email Address', type: 'email', ph: 'you@example.com' },
      ].map(f => (
        <div key={f.id} className="bg-surface px-5 pt-4 pb-4">
          <label className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 block mb-2" htmlFor={f.id}>
            {f.label}
          </label>
          <input id={f.id} type={f.type} required placeholder={f.ph}
            value={form[f.id as 'name' | 'email']}
            onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
            className="w-full bg-bg border border-border px-3 py-2.5 font-mono text-[11px] text-tx placeholder:text-tx3 focus:outline-none focus:border-accent transition-colors"/>
        </div>
      ))}
      <div className="bg-surface px-5 pt-4 pb-4">
        <label className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 block mb-2" htmlFor="message">
          Message
        </label>
        <textarea id="message" required rows={4} placeholder="Tell us about your use case…"
          value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          className="w-full bg-bg border border-border px-3 py-2.5 font-mono text-[11px] text-tx placeholder:text-tx3 focus:outline-none focus:border-accent transition-colors resize-none"/>
      </div>
      <button type="submit"
        className="bg-accent font-mono text-[11px] uppercase tracking-[0.2em] font-semibold text-[#07080b] py-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        Send Message <ArrowRight size={12}/>
      </button>
    </form>
  )
}
