import { useEffect, useState } from 'react'
import { BarChart2, CheckCircle, Target } from 'lucide-react'
import type { EvalSummary } from '../types'

export default function EvalBanner() {
  const [data, setData] = useState<EvalSummary | null>(null)

  useEffect(() => {
    fetch('/api/eval')
      .then(r => r.json())
      .then((d: EvalSummary) => { if (d.available) setData(d) })
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
        <BarChart2 size={15}/> SpaceNet SN4 Evaluation
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400">
        Tested on
        <span className="text-white font-medium mx-1">{data.tiles}</span>
        WorldView-2 tiles
      </div>
      <div className="flex gap-4 ml-auto">
        {[
          { icon: <Target size={12}/>,       label: 'Precision', value: data.avg_precision },
          { icon: <CheckCircle size={12}/>,   label: 'Recall',    value: data.avg_recall    },
          { icon: <BarChart2 size={12}/>,     label: 'F1 Score',  value: data.avg_f1        },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-1.5 text-xs">
            <span className="text-emerald-400/70">{m.icon}</span>
            <span className="text-slate-500">{m.label}</span>
            <span className="font-semibold text-white">
              {((m.value ?? 0) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
