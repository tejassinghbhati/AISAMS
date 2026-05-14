import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategorySummary } from '../types'
import { catColor } from './CategoryFilter'

const LABELS: Record<string, string> = {
  building: 'Buildings',
  tree: 'Trees',
  park: 'Parks',
  water: 'Water Bodies',
  road: 'Roads',
  drain: 'Drains',
  vehicle: 'Vehicles',
}

interface Props {
  total: number
  byCategory: Record<string, CategorySummary>
}

export default function SummaryPanel({ total, byCategory }: Props) {
  const chartData = Object.entries(byCategory).map(([cat, info]) => ({
    name: LABELS[cat] ?? cat,
    value: info.count,
    color: catColor(cat),
  }))

  const totalArea = Object.values(byCategory).reduce((s, v) => s + v.total_area_sqm, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-2">
        <StatChip label="Total Assets" value={total.toString()} />
        <StatChip label="Total Area" value={`${(totalArea / 1e6).toFixed(2)} km²`} />
        <StatChip label="Categories" value={Object.keys(byCategory).length.toString()} />
        <StatChip
          label="Avg Confidence"
          value={`${(
            Object.values(byCategory).reduce((s, v) => s + v.avg_confidence, 0) /
            Math.max(Object.keys(byCategory).length, 1) *
            100
          ).toFixed(0)}%`}
        />
      </div>

      {/* Donut chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}
              labelStyle={{ color: '#e6edf3' }}
              itemStyle={{ color: '#8b949e' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category rows */}
      <div className="flex flex-col gap-1.5">
        {Object.entries(byCategory)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([cat, info]) => (
            <div
              key={cat}
              className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-border"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: catColor(cat) }}
              />
              <span className="text-xs font-medium flex-1 capitalize">{LABELS[cat] ?? cat}</span>
              <span className="text-xs text-muted">{info.count} detected</span>
              <span className="text-xs text-muted border-l border-border pl-2 ml-1">
                {info.total_area_sqm.toLocaleString()} m²
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-border rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted mb-0.5">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  )
}
