import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Zap, Map, GitCompare, Crosshair,
  Mail, MapPin, Github, ChevronDown,
  ShieldCheck, Satellite, BarChart3, FileDown,
} from 'lucide-react'
import HeroDetectionDemo from '../components/HeroDetectionDemo'

// ── Shared texture style ──────────────────────────────────────────────────────
const TEXTURE: React.CSSProperties = {
  backgroundColor: '#e8e8e8',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`,
}
const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
}
const CARD_HOVER = 'hover:shadow-lg transition-shadow duration-200'

const MODULES = [
  { icon: <Crosshair size={20}/>, accent: '#1d4ed8', bg: '#EEF2FF',
    title: 'Asset Detection',
    desc: 'YOLOv8-seg + HSV spectral segmentation identifies buildings, roads, water bodies, drains and vehicles from any satellite tile.' },
  { icon: <Zap size={20}/>, accent: '#7c3aed', bg: '#F5F3FF',
    title: 'Land Cover Mapping',
    desc: 'DeepLabV3-MobileNetV3 trained on 792 DeepGlobe WorldView tiles — pixel-level classification into 7 land cover classes.' },
  { icon: <FileDown size={20}/>, accent: '#047857', bg: '#ECFDF5',
    title: 'GIS Export',
    desc: 'Every detection geo-referenced and exported as GeoJSON — compatible with QGIS, ArcGIS and eGov DIGIT GIS modules.' },
  { icon: <GitCompare size={20}/>, accent: '#b45309', bg: '#FFFBEB',
    title: 'Change Detection',
    desc: 'Temporal differencing automatically flags new construction, encroachments, vegetation loss and water body changes.' },
]

const STATS = [
  { value: '68,000+', label: 'km Rail Network',   color: '#1d4ed8' },
  { value: '7',       label: 'Asset Classes',     color: '#7c3aed' },
  { value: '59.7%',   label: 'mIoU Land Cover',   color: '#047857' },
  { value: '<1 sec',  label: 'Inference Time',    color: '#b45309' },
]

const TEAM = [
  { name: 'Tejas Singh Bhati', role: 'AI & Full-Stack',  initials: 'TB', color: '#1d4ed8' },
  { name: 'Team Member',       role: 'Data & GIS',       initials: 'TM', color: '#047857' },
  { name: 'Team Member',       role: 'Backend & Infra',  initials: 'TM', color: '#7c3aed' },
]

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="w-full font-sans" style={TEXTURE}>

      {/* ══════════════════════════════ HERO ════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-20"
        style={{
          background: 'linear-gradient(170deg, #dde8f5 0%, #e5e5e5 40%, #e8e4df 100%)',
          backgroundImage: `
            linear-gradient(170deg, #dde8f5 0%, #e5e5e5 40%, #e8e4df 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
          backgroundBlendMode: 'normal, multiply',
        }}>

        {/* Eyebrow pill */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium"
          style={{ background: 'rgba(29,78,216,0.1)', color: '#1d4ed8', border: '1px solid rgba(29,78,216,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block"/>
          Indian Railways × eGov DIGIT Platform · Hackzilla 2026
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-center mb-2 text-slate-900"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          Drishya
        </h1>
        <p className="text-slate-500 text-sm tracking-[0.45em] uppercase mb-6 text-center">
          दृश्य &nbsp;·&nbsp; Vision from Above
        </p>

        {/* Description */}
        <p className="text-center text-slate-600 text-base leading-relaxed max-w-xl mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>
          AI-powered spatial asset intelligence for India's 68,000 km railway network.
          Detect buildings, encroachments, water bodies and more from any satellite image — in under a second.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <button onClick={() => nav('/detect')}
            className="flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: '#1d4ed8', borderRadius: 10, boxShadow: '0 4px 14px rgba(29,78,216,0.35)' }}>
            Start Detection <ArrowRight size={14}/>
          </button>
          <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-7 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-white/60"
            style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', backdropFilter: 'blur(8px)' }}>
            Learn More
          </button>
        </div>

        {/* Demo */}
        <div className="w-full max-w-3xl mx-auto" style={{ borderRadius: 16, overflow: 'hidden', ...CARD, boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)' }}>
          <HeroDetectionDemo />
        </div>

        {/* Scroll hint */}
        <button onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-10 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
          <span className="text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Scroll to explore</span>
          <ChevronDown size={15} className="animate-bounce"/>
        </button>
      </section>

      {/* ══════════════════════════════ STATS ═══════════════════════════════ */}
      <section id="stats">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="grid grid-cols-4 gap-4">
            {STATS.map(s => (
              <div key={s.label} className={`rounded-xl px-6 py-6 text-center ${CARD_HOVER}`} style={CARD}>
                <div className="font-display font-bold text-2xl mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ MODULES ══════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1d4ed8', fontFamily: 'Inter, sans-serif' }}>
              Capabilities
            </p>
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">Four-module geospatial pipeline</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              From raw satellite imagery to exportable, geo-referenced asset intelligence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {MODULES.map(m => (
              <div key={m.title} className={`rounded-xl p-6 ${CARD_HOVER}`} style={CARD}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: m.bg, color: m.accent }}>
                  {m.icon}
                </div>
                <h3 className="font-display font-semibold text-slate-900 mb-2">{m.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ ABOUT ════════════════════════════════ */}
      <section id="about" className="py-20 px-6 scroll-mt-14">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1d4ed8', fontFamily: 'Inter, sans-serif' }}>
              About the Project
            </p>
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">Built for India's Railway Network</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Drishya automates detection and monitoring of spatial assets across railway land,
              helping divisions act on ground truth before issues escalate.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-5 mb-5">

            {/* Narrative */}
            <div className="lg:col-span-3 rounded-xl p-7" style={CARD}>
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck size={15} style={{ color: '#1d4ed8' }}/>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Mission</span>
              </div>
              <div className="space-y-3.5 text-slate-600 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                <p>India's 68,000 km railway network manages over <strong className="text-slate-900">1.2 million acres</strong> of land. Manual surveys are slow, expensive and leave months-long gaps during which encroachments and structural problems go undetected.</p>
                <p>Drishya processes satellite or drone imagery through a hybrid AI pipeline — YOLOv8-seg for object detection, DeepGlobe-trained segmentation for terrain classification — producing a geo-referenced asset inventory in under a second.</p>
                <p>Results export as GeoJSON ready for eGov DIGIT's Urban Infrastructure modules, closing the loop from raw imagery to actionable ground truth.</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {[['YOLOv8-seg','#1d4ed8'],['DeepLabV3','#047857'],['FastAPI','#7c3aed'],
                  ['React + Vite','#b45309'],['PyTorch','#dc2626'],['SpaceNet SN4','#1d4ed8'],
                  ['DeepGlobe','#047857'],['WorldView-2','#64748b']].map(([n, c]) => (
                  <span key={n} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600"
                    style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'Inter, sans-serif' }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }}/>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="lg:col-span-2 rounded-xl overflow-hidden" style={CARD}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <BarChart3 size={14} style={{ color: '#1d4ed8' }}/>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Model Performance</span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Precision',  value: '99.5%', pct: 99.5, color: '#047857' },
                  { label: 'Recall',     value: '34.4%', pct: 34.4, color: '#b45309' },
                  { label: 'F1 Score',   value: '50.8%', pct: 50.8, color: '#1d4ed8' },
                  { label: 'mIoU (LC)',  value: '59.7%', pct: 59.7, color: '#7c3aed' },
                ].map(m => (
                  <div key={m.label} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{m.label}</span>
                      <span className="text-sm font-bold font-display" style={{ color: m.color }}>{m.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>SpaceNet SN4 · WorldView-2 · IoU ≥ 0.5</p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="rounded-xl overflow-hidden" style={CARD}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Satellite size={14} style={{ color: '#1d4ed8' }}/>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Our Team</span>
              <span className="ml-auto text-xs text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>Hackzilla 2026</span>
            </div>
            <div className="grid sm:grid-cols-3 divide-x divide-slate-100">
              {TEAM.map((t, i) => (
                <div key={i} className="px-6 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white font-display"
                    style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 font-display">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ CONTACT ══════════════════════════════ */}
      <section id="contact" className="py-20 px-6 scroll-mt-14">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1d4ed8', fontFamily: 'Inter, sans-serif' }}>Contact</p>
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">Get in Touch</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Interested in deploying Drishya for a railway division, municipal body or research project?
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-5">

            {/* Info */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {[
                { icon: <Mail size={16}/>,   label: 'Email',    value: 'tejassinghbhati077@gmail.com', color: '#1d4ed8', bg: '#EEF2FF' },
                { icon: <Github size={16}/>,  label: 'GitHub',   value: 'tejassinghbhati/AISAMS',       color: '#7c3aed', bg: '#F5F3FF' },
                { icon: <MapPin size={16}/>,  label: 'Location', value: 'India · eGov DIGIT Platform',  color: '#047857', bg: '#ECFDF5' },
              ].map(c => (
                <div key={c.label} className={`flex items-center gap-4 p-4 rounded-xl ${CARD_HOVER}`} style={CARD}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: c.bg, color: c.color }}>
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{c.label}</div>
                    <div className="text-sm text-slate-700 font-medium mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ background: '#1e293b' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-display font-bold text-white text-sm">Drishya</span>
            <span className="text-slate-500 text-xs ml-2">· दृश्य · Vision from Above</span>
          </div>
          <span className="text-slate-500 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            Hackzilla 2026 · Indian Railways × eGov DIGIT
          </span>
        </div>
      </footer>
    </div>
  )
}

function ContactForm() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  if (sent) {
    return (
      <div className="rounded-xl h-full flex flex-col items-center justify-center gap-3 p-14"
        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-green-600 text-lg font-bold">✓</span>
        </div>
        <p className="font-display font-semibold text-green-800">Message sent!</p>
        <p className="text-sm text-green-600 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>We'll get back to you shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true) }}
      className="rounded-xl p-6 flex flex-col gap-4" style={CARD}>
      {[
        { id: 'name',  label: 'Full Name',     type: 'text',  ph: 'Your name'        },
        { id: 'email', label: 'Email Address', type: 'email', ph: 'you@example.com'  },
      ].map(f => (
        <div key={f.id}>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
            style={{ fontFamily: 'Inter, sans-serif' }} htmlFor={f.id}>
            {f.label}
          </label>
          <input id={f.id} type={f.type} required placeholder={f.ph}
            value={form[f.id as 'name' | 'email']}
            onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
            className="w-full rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors"
            style={{ border: '1px solid rgba(0,0,0,0.12)', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')}/>
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          style={{ fontFamily: 'Inter, sans-serif' }} htmlFor="message">
          Message
        </label>
        <textarea id="message" required rows={4} placeholder="Tell us about your use case…"
          value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          className="w-full rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors resize-none"
          style={{ border: '1px solid rgba(0,0,0,0.12)', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}
          onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')}/>
      </div>
      <button type="submit"
        className="w-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 font-display"
        style={{ background: '#1d4ed8', borderRadius: 10, boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
        Send Message <ArrowRight size={14}/>
      </button>
    </form>
  )
}
