import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Satellite, GitCompare, Activity, Layers } from 'lucide-react'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ChangePage from './pages/ChangePage'

export default function App() {
  const { pathname } = useLocation()
  const wide = pathname === '/results'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80"
        style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className={`${wide ? 'max-w-screen-2xl' : 'max-w-7xl'} mx-auto px-5 h-14 flex items-center gap-5`}>

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Satellite size={15} className="text-white"/>
            </div>
            <div className="leading-none">
              <div className="text-sm font-bold text-white tracking-tight">SpatialAI</div>
              <div className="text-[10px] text-slate-500 -mt-0.5 tracking-wide">INDIAN RAILWAYS · eGOV DIGIT</div>
            </div>
          </NavLink>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-800 hidden sm:block"/>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) => navCls(isActive, 'blue')}>
              <Activity size={13}/> Detect Assets
            </NavLink>
            <NavLink to="/change" className={({ isActive }) => navCls(isActive, 'orange')}>
              <GitCompare size={13}/> Change Detection
            </NavLink>
          </nav>

          {/* Right badge */}
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] text-slate-600 font-mono">
            <Layers size={11}/>
            <span>7 asset classes · YOLOv8 + Spectral</span>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className={`flex-1 ${wide ? '' : 'flex flex-col items-center'}`}>
        <Routes>
          <Route path="/"       element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/change"  element={<ChangePage />} />
        </Routes>
      </main>
    </div>
  )
}

function navCls(active: boolean, accent: 'blue' | 'orange') {
  const colors = {
    blue:   active ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'   : 'text-slate-500 border-transparent hover:text-slate-200 hover:bg-slate-800/60',
    orange: active ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'text-slate-500 border-transparent hover:text-slate-200 hover:bg-slate-800/60',
  }
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${colors[accent]}`
}
