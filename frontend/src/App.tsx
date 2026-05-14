import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Satellite, GitCompare, Activity } from 'lucide-react'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ChangePage from './pages/ChangePage'

export default function App() {
  const loc = useLocation()
  const onResults = loc.pathname === '/results'

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* ── Header ── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 mr-auto">
            <Satellite className="text-blue-400" size={22} />
            <span className="font-semibold text-sm tracking-wide">
              AI Spatial Asset Registry
            </span>
            <span className="hidden sm:block text-muted text-xs border-l border-border pl-3 ml-1">
              Indian Railways · eGov DIGIT
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Activity size={14} /> Detect
            </NavLink>
            <NavLink
              to="/change"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600/20 text-orange-400'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              <GitCompare size={14} /> Change Detection
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main className={`flex-1 ${onResults ? '' : 'flex items-center justify-center'}`}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/change" element={<ChangePage />} />
        </Routes>
      </main>
    </div>
  )
}
