import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategorySummary } from '../types'
import { catColor } from './CategoryFilter'

const LABELS: Record<string, string> = {
  building: 'Buildings',
  tree:     'Trees',
  park:     'Parks',
  water:    'Water Bodies',
  road:     'Roads',
  drain:    'Drains',
  vehicle:  'Vehicles',
}

interface Props {
  total: number
  byCategory: Record<string, CategorySummary>
}

export default function SummaryPanel({ total, byCategory }: Props) {
  const chartData = Object.entries(byCategory).map(([cat, info]) => ({
    name:  LABELS[cat] ?? cat,
    value: info.count,
    color: catColor(cat),
  }))

  const totalArea = Object.values(byCategory).reduce((s, v) => s + v.total_area_sqm, 0)
  const avgConf   = Object.values(byCategory).length
    ? Object.values(byCategory).reduce((s, v) => s + v.avg_confidence, 0) / Object.values(byCategory).length
    : 0

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 gap-2">
        <StatChip label="Total Assets"  value={total.toString()} accent="blue"/>
        <StatChip label="Coverage"      value={`${(totalArea / 1e6).toFixed(3)} km²`} accent="emerald"/>
        <StatChip label="Categories"    value={Object.keys(byCategory).length.toString()} accent="violet"/>
        <StatChip label="Avg Conf"      value={`${(avgConf * 100).toFixed(0)}%`} accent="orange"/>
      </div>

      {/* ── Donut chart ── */}
      {chartData.length > 0 && (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%"
                innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                {chartData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent"/>)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }}
                itemStyle={{ color: '#94a3b8' }}
                labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Category rows ── */}
      <div className="flex flex-col gap-1.5">
        {Object.entries(byCategory)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([cat, info]) => {
            const pct = total ? (info.count / total) * 100 : 0
            return (
              <div key={cat} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor(cat) }}/>
                  <span className="text-xs font-medium text-slate-200 flex-1 capitalize">
                    {LABELS[cat] ?? cat}
                  </span>
                  <span className="text-xs text-slate-500">{info.count}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: catColor(cat) }}/>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-600">
                    {info.total_area_sqm.toLocaleString()} m²
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {(info.avg_confidence * 100).toFixed(0)}% avg conf
                  </span>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

const ACCENT_COLORS: Record<string, string> = {
  blue:    'text-blue-400 bg-blue-500/8 border-blue-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20',
  violet:  'text-violet-400 bg-violet-500/8 border-violet-500/20',
  orange:  'text-orange-400 bg-orange-500/8 border-orange-500/20',
}

function StatChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl border p-3 ${ACCENT_COLORS[accent]}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-60 mb-0.5">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}
