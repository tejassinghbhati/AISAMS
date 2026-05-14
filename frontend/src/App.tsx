import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Activity, GitCompare, ScanSearch, Eye } from 'lucide-react'
import LandingPage from './pages/LandingPage'
import UploadPage  from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ChangePage  from './pages/ChangePage'
import SegmentPage from './pages/SegmentPage'

export default function App() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  const wide = pathname === '/results'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isLanding ? '#ffffff' : '#07080b' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50"
        style={isLanding
          ? { borderBottom: '1px solid rgba(0,0,0,0.1)', background: 'rgba(232,232,232,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }
          : { borderBottom: '1px solid #21262d', background: '#07080b' }
        }>
        <div className={`${wide ? 'max-w-screen-2xl' : 'max-w-4xl'} mx-auto px-5 h-14 flex items-center gap-4`}>

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: isLanding ? '#1d4ed8' : 'rgba(56,139,253,0.12)', border: isLanding ? 'none' : '1px solid rgba(56,139,253,0.4)' }}>
              <Eye size={14} style={{ color: isLanding ? '#ffffff' : '#388bfd' }}/>
            </div>
            <div className="leading-none">
              <div className="font-bold text-[14px] tracking-wide" style={{ color: isLanding ? '#1e293b' : '#c9d1d9', fontFamily: 'Poppins, sans-serif' }}>
                Drishya
              </div>
              <div className="text-[8px] tracking-wider uppercase font-medium mt-px"
                style={{ color: isLanding ? '#94a3b8' : '#484f58' }}>
                Indian Railways · eGov DIGIT
              </div>
            </div>
          </NavLink>

          <div className="w-px h-5 mx-1" style={{ background: isLanding ? '#e2e8f0' : '#21262d' }}/>

          {/* Nav */}
          <nav className="flex items-center">
            {[
              { to: '/',        label: 'Home',       icon: <Eye size={11}/>,        end: true  },
              { to: '/detect',  label: 'Detect',     icon: <Activity size={11}/>,   end: true  },
              { to: '/change',  label: 'Changes',    icon: <GitCompare size={11}/>, end: false },
              { to: '/segment', label: 'Land Cover', icon: <ScanSearch size={11}/>, end: false },
            ].map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => {
                  const base = 'flex items-center gap-1.5 px-3 h-14 text-xs font-medium border-b-2 transition-colors'
                  if (isLanding) {
                    return `${base} ${isActive
                      ? 'text-blue-700 border-blue-700'
                      : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'}`
                  }
                  return `${base} font-mono uppercase tracking-wider text-[10px] ${isActive
                    ? 'text-[#388bfd] border-[#388bfd]'
                    : 'text-[#8b949e] border-transparent hover:text-[#c9d1d9] hover:border-[#30363d]'}`
                }}>
                {n.icon}{n.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {isLanding ? (
              <NavLink to="/detect"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors">
                Open Tool <Activity size={11}/>
              </NavLink>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] inline-block animate-blink"/>
                <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#484f58]">System Online</span>
              </>
            )}
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
