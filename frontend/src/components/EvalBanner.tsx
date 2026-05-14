import { useEffect, useState } from 'react'
import type { EvalSummary } from '../types'

export default function EvalBanner() {
  const [data, setData] = useState<EvalSummary | null>(null)
  useEffect(() => {
    fetch('/api/eval').then(r => r.json()).then((d: EvalSummary) => { if (d.available) setData(d) }).catch(() => {})
  }, [])
  if (!data) return null
  return (
    <div className="mb-5 border border-border flex items-stretch overflow-hidden">
      <div className="px-4 py-2 border-r border-border flex items-center gap-2.5 bg-panel">
        <span className="w-1.5 h-1.5 bg-[#3fb950] inline-block" />
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-tx2">
          SpaceNet SN4 · {data.tiles} tiles
        </span>
      </div>
      {[
        { label: 'PRECISION', value: data.avg_precision },
        { label: 'RECALL',    value: data.avg_recall    },
        { label: 'F1',        value: data.avg_f1        },
      ].map(m => (
        <div key={m.label} className="px-5 py-2 border-r border-border flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-tx3">{m.label}</span>
          <span className="font-mono text-sm font-bold text-tx">{((m.value ?? 0) * 100).toFixed(1)}%</span>
        </div>
      ))}
      <div className="ml-auto px-4 py-2 flex items-center">
        <span className="font-mono text-[9px] text-tx3 uppercase tracking-widest">WorldView-2 · Atlanta, GA</span>
      </div>
    </div>
  )
}
