import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategorySummary } from '../types'
import { catColor } from './CategoryFilter'

const LABELS: Record<string, string> = {
  building: 'Buildings', tree: 'Trees', park: 'Parks',
  water: 'Water Bodies', road: 'Roads', drain: 'Drains', vehicle: 'Vehicles',
}

interface Props { total: number; byCategory: Record<string, CategorySummary> }

export default function SummaryPanel({ total, byCategory }: Props) {
  const totalArea = Object.values(byCategory).reduce((s, v) => s + v.total_area_sqm, 0)
  const avgConf   = Object.values(byCategory).length
    ? Object.values(byCategory).reduce((s, v) => s + v.avg_confidence, 0) / Object.values(byCategory).length
    : 0
  const chartData = Object.entries(byCategory).map(([cat, info]) => ({
    name: LABELS[cat] ?? cat, value: info.count, color: catColor(cat),
  }))

  return (
    <div className="flex flex-col gap-4">

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-px bg-border">
        {[
          { label: 'TOTAL ASSETS',  value: total.toString() },
          { label: 'COVERAGE',      value: `${(totalArea / 1e4).toFixed(2)} ha` },
          { label: 'CATEGORIES',    value: Object.keys(byCategory).length.toString() },
          { label: 'AVG CONF',      value: `${(avgConf * 100).toFixed(0)}%` },
        ].map(s => (
          <div key={s.label} className="bg-panel px-3 py-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-tx3 mb-1">{s.label}</div>
            <div className="font-mono text-lg font-bold text-tx">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Donut */}
      {chartData.length > 0 && (
        <div className="h-40 border border-border">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
                paddingAngle={2} dataKey="value" strokeWidth={0}>
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                itemStyle={{ color: '#8b949e' }}
                labelStyle={{ color: '#c9d1d9', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category rows */}
      <div className="flex flex-col gap-px bg-border">
        {Object.entries(byCategory)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([cat, info]) => {
            const pct = total ? (info.count / total) * 100 : 0
            return (
              <div key={cat} className="bg-panel px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 shrink-0" style={{ background: catColor(cat) }}/>
                  <span className="text-[11px] font-medium text-tx flex-1 capitalize">{LABELS[cat] ?? cat}</span>
                  <span className="font-mono text-[11px] text-tx2">{info.count}</span>
                </div>
                <div className="h-px bg-border overflow-hidden">
                  <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: catColor(cat) }}/>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-[9px] text-tx3">{info.total_area_sqm.toLocaleString()} m²</span>
                  <span className="font-mono text-[9px] text-tx3">{(info.avg_confidence * 100).toFixed(0)}% conf</span>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
