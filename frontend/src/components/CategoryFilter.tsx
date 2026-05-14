import type { CategorySummary } from '../types'

const LABELS: Record<string, string> = {
  building: 'Buildings',
  tree: 'Trees',
  park: 'Parks',
  water: 'Water',
  road: 'Roads',
  drain: 'Drains',
  vehicle: 'Vehicles',
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {Object.entries(categories).map(([cat, info]) => {
          const on = active.has(cat)
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                on
                  ? 'border-current opacity-100'
                  : 'border-border text-muted opacity-50'
              }`}
              style={on ? { color: catColor(cat), borderColor: catColor(cat), backgroundColor: catColor(cat) + '22' } : {}}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: on ? catColor(cat) : '#484f58' }}
              />
              {LABELS[cat] ?? cat}
              <span className="opacity-70">({info.count})</span>
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-3 text-xs text-muted">
        <span className="whitespace-nowrap">Min confidence</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={minConf}
          onChange={e => onConfChange(parseFloat(e.target.value))}
          className="flex-1 accent-blue-500"
        />
        <span className="w-10 text-right text-white">{(minConf * 100).toFixed(0)}%</span>
      </label>
    </div>
  )
}

export function catColor(cat: string): string {
  const map: Record<string, string> = {
    building: '#dc3545',
    tree: '#22863a',
    park: '#28a745',
    water: '#1f6feb',
    road: '#8b949e',
    drain: '#e36209',
    vehicle: '#8957e5',
  }
  return map[cat] ?? '#888888'
}
