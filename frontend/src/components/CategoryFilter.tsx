import type { CategorySummary } from '../types'

const LABELS: Record<string, string> = {
  building: 'Buildings', tree: 'Trees', park: 'Parks',
  water: 'Water', road: 'Roads', drain: 'Drains', vehicle: 'Vehicles',
}

export function catColor(cat: string): string {
  return ({
    building: '#f85149', tree: '#3fb950', park:    '#3fb950',
    water:    '#388bfd', road: '#8b949e', drain:   '#d29922',
    vehicle:  '#a371f7',
  } as Record<string,string>)[cat] ?? '#8b949e'
}

interface Props {
  categories: Record<string, CategorySummary>
  active: Set<string>
  onToggle: (cat: string) => void
  minConf: number
  onConfChange: (v: number) => void
}

export default function CategoryFilter({ categories, active, onToggle, minConf, onConfChange }: Props) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Category toggles */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(categories).map(([cat, info]) => {
          const on = active.has(cat)
          return (
            <button key={cat} onClick={() => onToggle(cat)}
              className="flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-medium transition-all font-mono"
              style={on
                ? { borderColor: catColor(cat), color: catColor(cat), background: catColor(cat) + '14' }
                : { borderColor: '#21262d', color: '#484f58' }
              }>
              <span className="w-1.5 h-1.5 inline-block" style={{ background: on ? catColor(cat) : '#484f58' }}/>
              {LABELS[cat] ?? cat}
              <span style={{ opacity: 0.6 }}>({info.count})</span>
            </button>
          )
        })}
      </div>

      {/* Confidence slider */}
      <label className="flex items-center gap-3 ml-auto">
        <span className="font-mono text-[9px] uppercase tracking-widest text-tx3 whitespace-nowrap">Min conf</span>
        <input type="range" min={0} max={1} step={0.05} value={minConf}
          onChange={e => onConfChange(parseFloat(e.target.value))}
          className="w-24 accent-accent" />
        <span className="font-mono text-[11px] text-tx w-8 text-right">{(minConf * 100).toFixed(0)}%</span>
      </label>
    </div>
  )
}
