import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Map, GitCompare, Crosshair, Mail, Phone, MapPin, Github } from 'lucide-react'
import HeroDetectionDemo from '../components/HeroDetectionDemo'

const MODULES = [
  {
    code: 'MOD-01', accent: '#388bfd', icon: <Crosshair size={13}/>,
    title: 'Asset Detection',
    desc: 'YOLOv8-seg + HSV spectral segmentation identifies buildings, trees, water bodies, drains, roads and vehicles from any satellite tile.',
  },
  {
    code: 'MOD-02', accent: '#a371f7', icon: <Zap size={13}/>,
    title: 'Land Cover Mapping',
    desc: 'DeepLabV3-MobileNetV3 trained on 792 DeepGlobe WorldView tiles provides pixel-level 7-class land cover segmentation.',
  },
  {
    code: 'MOD-03', accent: '#3fb950', icon: <Map size={13}/>,
    title: 'GIS Export',
    desc: 'Every detection is geo-referenced and exported as a standards-compliant GeoJSON layer ready for QGIS, ArcGIS or DIGIT GIS modules.',
  },
  {
    code: 'MOD-04', accent: '#d29922', icon: <GitCompare size={13}/>,
    title: 'Change Detection',
    desc: 'Temporal differencing between two acquisitions automatically flags new construction, encroachments, vegetation loss and water change.',
  },
]

const STATS = [
  { value: '68K km', label: 'Rail network monitored' },
  { value: '7',      label: 'Asset / cover classes'  },
  { value: '59.7%',  label: 'mIoU land cover model'  },
  { value: '<1 s',   label: 'Detection inference'    },
]

const TEAM = [
  { name: 'Tejas Singh Bhati', role: 'AI / Full-Stack', initials: 'TB' },
  { name: 'Team Member',       role: 'Data / GIS',      initials: 'TM' },
  { name: 'Team Member',       role: 'Backend / Infra', initials: 'TM' },
]

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="w-full">

      {/* ═══════════════════════ HERO ══════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-44px)] flex items-center border-b border-border overflow-hidden">

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(56,139,253,0.07) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}/>

        <div className="relative max-w-7xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* ── Left ── */}
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block animate-blink"/>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-tx3">
                Indian Railways × eGov DIGIT · Hackzilla 2026
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4rem] font-bold leading-[1.05] tracking-tight mb-2 text-tx">
              Nigahban
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-tx3 mb-6">
              نگاہبان &nbsp;·&nbsp; Guardian from Above
            </p>

            <p className="text-tx2 text-[15px] leading-relaxed mb-8 max-w-lg">
              AI-powered spatial asset intelligence for India's railway network.
              Upload any satellite, aerial or drone image — Nigahban detects
              and classifies every structure, water body, road and encroachment
              in under a second.
            </p>

            {/* Stat row */}
            <div className="flex gap-px border border-border mb-8 overflow-hidden">
              {STATS.map(s => (
                <div key={s.label} className="flex-1 bg-panel px-3 py-2.5">
                  <div className="font-mono text-sm font-bold text-tx">{s.value}</div>
                  <div className="font-mono text-[8px] uppercase tracking-widest text-tx3 mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => nav('/detect')}
                className="flex items-center gap-2 px-6 py-3 bg-accent font-mono text-[11px] uppercase tracking-[0.2em] font-semibold text-[#07080b] hover:opacity-90 transition-opacity">
                Start Detection <ArrowRight size={13}/>
              </button>
              <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-6 py-3 border border-border font-mono text-[11px] uppercase tracking-[0.2em] text-tx2 hover:text-tx hover:border-border2 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* ── Right: live demo ── */}
          <div>
            <HeroDetectionDemo />
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-1 h-1 bg-tx3 inline-block"/>
              <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">
                Live detection on real satellite imagery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MODULES ═══════════════════════════════════ */}
      <section className="border-b border-border py-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center gap-3 mb-10">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-tx3">System Modules</span>
            <div className="flex-1 h-px bg-border"/>
            <span className="font-mono text-[9px] text-tx3">v2.0 · 2026</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {MODULES.map(m => (
              <div key={m.code} className="bg-surface p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="p-1.5 border" style={{ borderColor: m.accent + '40', color: m.accent }}>
                    {m.icon}
                  </span>
                  <span className="font-mono text-[9px] text-tx3">{m.code}</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-tx mb-2">{m.title}</div>
                <p className="text-tx3 text-[11px] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ABOUT ════════════════════════════════════ */}
      <section id="about" className="border-b border-border py-20">
        <div className="max-w-7xl mx-auto px-5">

          <div className="flex items-center gap-3 mb-12">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-tx3">About Nigahban</span>
            <div className="flex-1 h-px bg-border"/>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left: narrative */}
            <div>
              <h2 className="text-3xl font-bold text-tx mb-5 leading-tight">
                Automating Railway Asset<br/>
                <span style={{ color: '#388bfd' }}>Intelligence at Scale</span>
              </h2>
              <div className="space-y-4 text-tx2 text-sm leading-relaxed">
                <p>
                  India's 68,000 km railway network manages an estimated
                  <span className="text-tx font-medium"> 1.2 million acres</span> of land.
                  Today, asset surveys are largely manual — slow, expensive and prone to gaps
                  that allow encroachments and structural degradation to go undetected for months.
                </p>
                <p>
                  Nigahban changes that. By combining YOLOv8-seg object detection with
                  colour-based spectral segmentation and a DeepGlobe-trained land-cover model,
                  any satellite or drone image can be processed in under a second to produce
                  a fully geo-referenced asset inventory.
                </p>
                <p>
                  Results are exported as standards-compliant GeoJSON, ready to be ingested
                  into eGov DIGIT's Urban Infrastructure modules or any GIS platform — closing
                  the loop from raw imagery to actionable ground truth.
                </p>
              </div>

              {/* Tech stack pills */}
              <div className="mt-8">
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 mb-3">Built With</div>
                <div className="flex flex-wrap gap-px bg-border">
                  {[
                    ['YOLOv8-seg',         '#388bfd'],
                    ['DeepLabV3',          '#3fb950'],
                    ['FastAPI',            '#a371f7'],
                    ['React + Vite',       '#d29922'],
                    ['SpaceNet SN4',       '#388bfd'],
                    ['DeepGlobe LC',       '#3fb950'],
                    ['WorldView-2',        '#8b949e'],
                    ['PyTorch 2.12',       '#f85149'],
                  ].map(([name, color]) => (
                    <div key={name} className="bg-panel px-3 py-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 shrink-0" style={{ background: color }}/>
                      <span className="font-mono text-[9px] text-tx2">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: team + eval metrics */}
            <div className="space-y-6">

              {/* Model performance */}
              <div className="border border-border">
                <div className="flex items-center gap-2 px-4 py-3 bg-panel border-b border-border">
                  <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block"/>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx2">Model Performance</span>
                </div>
                <div className="flex gap-px bg-border">
                  {[
                    { label: 'Precision', value: '99.5%', color: '#3fb950' },
                    { label: 'Recall',    value: '34.4%', color: '#d29922' },
                    { label: 'F1 Score',  value: '50.8%', color: '#388bfd' },
                    { label: 'mIoU LC',   value: '59.7%', color: '#a371f7' },
                  ].map(m => (
                    <div key={m.label} className="flex-1 bg-surface px-3 py-4 text-center">
                      <div className="font-mono text-xl font-bold mb-1" style={{ color: m.color }}>{m.value}</div>
                      <div className="font-mono text-[8px] uppercase tracking-widest text-tx3">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 bg-panel border-t border-border">
                  <span className="font-mono text-[8px] text-tx3">
                    SpaceNet SN4 · WorldView-2 · Atlanta · IoU ≥ 0.5 threshold
                  </span>
                </div>
              </div>

              {/* Team */}
              <div className="border border-border">
                <div className="flex items-center gap-2 px-4 py-3 bg-panel border-b border-border">
                  <span className="w-1.5 h-1.5 bg-accent inline-block"/>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tx2">Team</span>
                  <span className="font-mono text-[9px] text-tx3 ml-auto">Hackzilla 2026</span>
                </div>
                <div className="flex flex-col gap-px bg-border">
                  {TEAM.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 bg-surface px-4 py-3">
                      <div className="w-7 h-7 border border-border2 flex items-center justify-center shrink-0">
                        <span className="font-mono text-[9px] font-bold text-tx3">{t.initials}</span>
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
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CONTACT ══════════════════════════════════ */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-5">

          <div className="flex items-center gap-3 mb-12">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-tx3">Contact</span>
            <div className="flex-1 h-px bg-border"/>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">

            {/* Left: contact info */}
            <div>
              <h2 className="text-2xl font-bold text-tx mb-4">Get in Touch</h2>
              <p className="text-tx2 text-sm leading-relaxed mb-8 max-w-md">
                Interested in deploying Nigahban for your railway division, municipal body,
                or research project? Reach out for a demo or collaboration.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <Mail size={12}/>,   label: 'Email',    value: 'tejassinghbhati077@gmail.com', accent: '#388bfd' },
                  { icon: <Github size={12}/>,  label: 'GitHub',   value: 'github.com/tejassinghbhati/AISAMS', accent: '#a371f7' },
                  { icon: <MapPin size={12}/>,  label: 'Location', value: 'India · Built for eGov DIGIT', accent: '#3fb950' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-4 border border-border px-4 py-3 bg-panel">
                    <span style={{ color: c.accent }}>{c.icon}</span>
                    <div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3">{c.label}</div>
                      <div className="font-mono text-[10px] text-tx mt-0.5">{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: contact form */}
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  )
}

function ContactForm() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // demo — just show success state
    setSent(true)
  }

  if (sent) {
    return (
      <div className="border border-[#3fb950]/40 bg-[#3fb950]/06 flex flex-col items-center justify-center gap-3 p-12">
        <span className="w-2.5 h-2.5 bg-[#3fb950] inline-block"/>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#3fb950]">Message received</span>
        <span className="font-mono text-[9px] text-tx3 text-center max-w-xs">
          We'll get back to you shortly.
        </span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-px bg-border">
      {[
        { id: 'name',    label: 'Full Name',     type: 'text',  placeholder: 'Your name'          },
        { id: 'email',   label: 'Email Address', type: 'email', placeholder: 'you@example.com'    },
      ].map(f => (
        <div key={f.id} className="bg-panel px-4 pt-3 pb-4">
          <label className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 block mb-2" htmlFor={f.id}>
            {f.label}
          </label>
          <input
            id={f.id} type={f.type} required
            value={form[f.id as 'name' | 'email']}
            onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full bg-bg border border-border px-3 py-2 font-mono text-[11px] text-tx placeholder:text-tx3 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      ))}
      <div className="bg-panel px-4 pt-3 pb-4">
        <label className="font-mono text-[8px] uppercase tracking-[0.2em] text-tx3 block mb-2" htmlFor="message">
          Message
        </label>
        <textarea
          id="message" required rows={5}
          value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          placeholder="Tell us about your use case…"
          className="w-full bg-bg border border-border px-3 py-2 font-mono text-[11px] text-tx placeholder:text-tx3 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>
      <button type="submit"
        className="bg-accent font-mono text-[11px] uppercase tracking-[0.2em] font-semibold text-[#07080b] py-3.5 hover:opacity-90 transition-opacity">
        Send Message →
      </button>
    </form>
  )
}

// need useState for ContactForm
import { useState } from 'react'
