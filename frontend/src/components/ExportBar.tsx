import { Download } from 'lucide-react'
import { exportUrl } from '../api/client'

export default function ExportBar({ jobId }: { jobId: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-tx3 flex items-center gap-1.5 mr-1">
        <Download size={11} /> Export
      </span>
      {([
        { fmt: 'geojson'   as const, label: 'GeoJSON'   },
        { fmt: 'csv'       as const, label: 'CSV'        },
        { fmt: 'shapefile' as const, label: 'Shapefile'  },
      ]).map(({ fmt, label }) => (
        <a key={fmt} href={exportUrl(jobId, fmt)} download
          className="px-3 py-1 border border-border text-[11px] font-medium text-tx2 hover:text-tx hover:border-border2 transition-colors font-mono tracking-wide">
          {label}
        </a>
      ))}
    </div>
  )
}
