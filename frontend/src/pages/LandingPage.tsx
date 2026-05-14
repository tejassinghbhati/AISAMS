import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Zap, Map, GitCompare, Crosshair,
  Mail, MapPin, Github, ChevronDown,
  ShieldCheck, Satellite, BarChart3, FileDown,
} from 'lucide-react'
import HeroDetectionDemo from '../components/HeroDetectionDemo'

const MODULES = [
  {
    icon: <Crosshair size={22} />, accent: '#1d4ed8', bg: '#eff6ff',
    title: 'Asset Detection',
    desc: 'YOLOv8-seg + spectral segmentation detects buildings, roads, water bodies, drains and vehicles from any satellite tile.',
  },
  {
    icon: <Zap size={22} />, accent: '#7c3aed', bg: '#f5f3ff',
    title: 'Land Cover Mapping',
    desc: 'DeepLabV3 trained on DeepGlobe WorldView tiles delivers pixel-level classification across 7 land cover classes.',
  },
  {
    icon: <FileDown size={22} />, accent: '#059669', bg: '#ecfdf5',
    title: 'GIS Export',
    desc: 'Every detection geo-referenced and exported as GeoJSON — compatible with QGIS, ArcGIS and eGov DIGIT GIS modules.',
  },
  {
    icon: <GitCompare size={22} />, accent: '#d97706', bg: '#fffbeb',
    title: 'Change Detection',
    desc: 'Temporal differencing flags encroachments, new construction, vegetation loss and water changes between acquisitions.',
  },
]

const STATS = [
  { value: '68,000+', label: 'km Rail Network',    color: '#1d4ed8' },
  { value: '7',       label: 'Detection Classes',  color: '#7c3aed' },
  { value: '59.7%',   label: 'mIoU Land Cover',    color: '#059669' },
  { value: '<1 sec',  label: 'Inference Time',      color: '#d97706' },
]

const TEAM = [
  { name: 'Tejas Singh Bhati', role: 'AI & Full-Stack',  initials: 'TB', color: '#1d4ed8' },
  { name: 'Team Member',       role: 'Data & GIS',       initials: 'TM', color: '#059669' },
  { name: 'Team Member',       role: 'Backend & Infra',  initials: 'TM', color: '#7c3aed' },
]

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="w-full bg-white text-slate-800">

      {/* ════════════════════════════ HERO ════════════════════════════════════ */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f0f7ff 0%, #ffffff 50%, #fff7ed 100%)' }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.35,
          }}/>

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-10 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block"/>
            Indian Railways × eGov DIGIT Platform · Hackzilla 2026
          </div>

          {/* Title */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 mb-3"
            style={{ letterSpacing: '-0.03em' }}>
            Drishya
          </h1>
          <p className="text-slate-400 text-sm tracking-[0.4em] uppercase mb-5">
            दृश्य &nbsp;·&nbsp; Vision from Above
          </p>

          {/* Subtitle */}
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            AI-powered spatial asset intelligence for India's railway network.
            Upload any satellite or drone image to detect buildings, encroachments,
            water bodies and more — with GIS-ready export.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mb-14">
            <button onClick={() => nav('/detect')}
              className="flex items-center gap-2 px-7 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-200">
              Start Detection <ArrowRight size={15}/>
            </button>
            <button
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-7 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors">
              Learn More
            </button>
          </div>

          {/* Demo panel */}
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200 max-w-3xl mx-auto">
            <HeroDetectionDemo />
          </div>

          {/* Scroll hint */}
          <button
            onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-10 flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors mx-auto">
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown size={16} className="animate-bounce"/>
          </button>
        </div>
      </section>

      {/* ════════════════════════════ STATS ═══════════════════════════════════ */}
      <section id="stats" className="border-y border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-4 divide-x divide-slate-200">
            {STATS.map(s => (
              <div key={s.label} className="px-8 py-8 text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════ MODULES ════════════════════════════════ */}
      <section className="py-20 px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-blue-700 text-xs font-semibold uppercase tracking-widest mb-3">What Drishya Does</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Four-module geospatial pipeline</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              From raw satellite imagery to actionable, exportable asset intelligence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {MODULES.map(m => (
              <div key={m.title}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: m.bg, color: m.accent }}>
                  {m.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{m.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════ ABOUT ══════════════════════════════════ */}
      <section id="about" className="py-20 px-6 bg-white border-b border-slate-200 scroll-mt-11">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-14">
            <p className="text-blue-700 text-xs font-semibold uppercase tracking-widest mb-3">About the Project</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Built for India's Railway Network</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              Drishya automates detection and monitoring of spatial assets across India's railway land,
              helping divisions act on ground truth before issues escalate.
            </p>
          </div>

          {/* Narrative + metrics */}
          <div className="grid lg:grid-cols-5 gap-6 mb-8">

            {/* Narrative */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200 p-7 bg-slate-50">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck size={16} className="text-blue-700"/>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Mission</span>
              </div>
              <div className="space-y-3.5 text-slate-600 text-sm leading-relaxed">
                <p>
                  India's 68,000 km railway network manages over
                  <strong className="text-slate-900"> 1.2 million acres</strong> of land.
                  Manual surveys are slow, expensive and leave months-long gaps
                  during which encroachments and structural problems go undetected.
                </p>
                <p>
                  Drishya processes satellite or drone imagery through a hybrid AI pipeline
                  — YOLOv8-seg for object detection, DeepGlobe-trained segmentation for terrain
                  classification — producing a geo-referenced asset inventory in under a second.
                </p>
                <p>
                  Results export as GeoJSON ready for eGov DIGIT's Urban Infrastructure
                  modules, closing the loop from raw imagery to actionable ground truth.
                </p>
              </div>

              {/* Tech chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  ['YOLOv8-seg', '#1d4ed8'], ['DeepLabV3', '#059669'],
                  ['FastAPI',    '#7c3aed'], ['React + Vite', '#d97706'],
                  ['PyTorch',    '#dc2626'], ['SpaceNet SN4', '#1d4ed8'],
                  ['DeepGlobe',  '#059669'], ['WorldView-2',  '#64748b'],
                ].map(([n, c]) => (
                  <span key={n} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }}/>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center gap-2">
                <BarChart3 size={14} className="text-blue-700"/>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Model Performance</span>
              </div>
              <div className="divide-y divide-slate-200">
                {[
                  { label: 'Precision',  value: '99.5%', pct: 99.5, color: '#059669' },
                  { label: 'Recall',     value: '34.4%', pct: 34.4, color: '#d97706' },
                  { label: 'F1 Score',   value: '50.8%', pct: 50.8, color: '#1d4ed8' },
                  { label: 'mIoU (LC)',  value: '59.7%', pct: 59.7, color: '#7c3aed' },
                ].map(m => (
                  <div key={m.label} className="px-5 py-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">{m.label}</span>
                      <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-slate-200 bg-white">
                <p className="text-[10px] text-slate-400">SpaceNet SN4 · WorldView-2 · IoU ≥ 0.5</p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-2">
              <Satellite size={14} className="text-blue-700"/>
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Our Team</span>
              <span className="ml-auto text-xs text-slate-400">Hackzilla 2026</span>
            </div>
            <div className="grid sm:grid-cols-3 divide-x divide-slate-200">
              {TEAM.map((t, i) => (
                <div key={i} className="px-6 py-5 flex items-center gap-4 bg-white">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white"
                    style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════ CONTACT ════════════════════════════════ */}
      <section id="contact" className="py-20 px-6 bg-slate-50 scroll-mt-11">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-blue-700 text-xs font-semibold uppercase tracking-widest mb-3">Contact</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Get in Touch</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Interested in deploying Drishya for a railway division, municipal body or research project?
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">

            {/* Info */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {[
                { icon: <Mail size={16}/>,   label: 'Email',    value: 'tejassinghbhati077@gmail.com', color: '#1d4ed8', bg: '#eff6ff' },
                { icon: <Github size={16}/>,  label: 'GitHub',   value: 'tejassinghbhati/AISAMS',       color: '#7c3aed', bg: '#f5f3ff' },
                { icon: <MapPin size={16}/>,  label: 'Location', value: 'India · eGov DIGIT Platform',  color: '#059669', bg: '#ecfdf5' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: c.bg, color: c.color }}>
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{c.label}</div>
                    <div className="text-sm text-slate-700 font-medium mt-0.5">{c.value}</div>
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
      <footer className="bg-slate-900 text-slate-400 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-white font-semibold text-sm">Drishya</span>
            <span className="text-slate-500 text-xs ml-2">· दृश्य · Vision from Above</span>
          </div>
          <span className="text-xs">Built for Hackzilla 2026 · Indian Railways × eGov DIGIT</span>
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
      <div className="rounded-xl border border-green-200 bg-green-50 h-full flex flex-col items-center justify-center gap-3 p-14">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-green-600 text-lg">✓</span>
        </div>
        <p className="font-semibold text-green-800">Message sent!</p>
        <p className="text-sm text-green-600 text-center">We'll get back to you shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true) }}
      className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4">
      {[
        { id: 'name',  label: 'Full Name',     type: 'text',  ph: 'Your name'       },
        { id: 'email', label: 'Email Address', type: 'email', ph: 'you@example.com' },
      ].map(f => (
        <div key={f.id}>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor={f.id}>
            {f.label}
          </label>
          <input id={f.id} type={f.type} required placeholder={f.ph}
            value={form[f.id as 'name' | 'email']}
            onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"/>
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="message">
          Message
        </label>
        <textarea id="message" required rows={4} placeholder="Tell us about your use case…"
          value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors resize-none"/>
      </div>
      <button type="submit"
        className="w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
        Send Message <ArrowRight size={14}/>
      </button>
    </form>
  )
}
