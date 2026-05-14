import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Activity, GitCompare, ScanSearch, Eye } from 'lucide-react'
import LandingPage from './pages/LandingPage'
import UploadPage  from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ChangePage  from './pages/ChangePage'
import SegmentPage from './pages/SegmentPage'

export default function App() {
  const { pathname } = useLocation()
  const wide = pathname === '/results'

  return (
    <div className="min-h-screen flex flex-col bg-bg">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg">
        <div className={`${wide ? 'max-w-screen-2xl' : 'max-w-7xl'} mx-auto px-5 h-11 flex items-center gap-4`}>

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 border border-accent/60 flex items-center justify-center bg-accent/8">
              <Eye size={12} className="text-accent"/>
            </div>
            <div className="leading-none">
              <div className="text-[12px] font-bold tracking-[0.12em] uppercase text-tx">Drishya</div>
              <div className="font-mono text-[7px] tracking-[0.1em] uppercase text-tx3 mt-px">
                Indian Railways · eGov DIGIT
              </div>
            </div>
          </NavLink>

          <div className="w-px h-4 bg-border2"/>

          {/* Nav */}
          <nav className="flex items-center">
            {[
              { to: '/',        label: 'Home',       icon: <Eye size={11}/>,        end: true  },
              { to: '/detect',  label: 'Detect',     icon: <Activity size={11}/>,   end: true  },
              { to: '/change',  label: 'Changes',    icon: <GitCompare size={11}/>, end: false },
              { to: '/segment', label: 'Land Cover', icon: <ScanSearch size={11}/>, end: false },
            ].map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 h-11 font-mono text-[10px] uppercase tracking-[0.12em] border-b-2 transition-colors ${
                    isActive
                      ? 'text-accent border-accent'
                      : 'text-tx2 border-transparent hover:text-tx hover:border-border2'
                  }`
                }>
                {n.icon}{n.label}
              </NavLink>
            ))}
          </nav>

          {/* System status */}
          <div className="ml-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block animate-blink"/>
            <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-tx3">System Online</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className={`flex-1 ${wide ? '' : 'flex flex-col items-center'}`}>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/detect"  element={<UploadPage  />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/change"  element={<ChangePage  />} />
          <Route path="/segment" element={<SegmentPage />} />
        </Routes>
      </main>
    </div>
  )
}
