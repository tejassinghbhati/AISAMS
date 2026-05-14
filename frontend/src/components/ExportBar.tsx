import { Download, FileJson, Table } from 'lucide-react'
import { exportUrl } from '../api/client'

export default function ExportBar({ jobId }: { jobId: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted mr-1 flex items-center gap-1">
        <Download size={12} /> Export
      </span>
      <a
        href={exportUrl(jobId, 'geojson')}
        download
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted hover:text-white hover:border-blue-500 transition-colors"
      >
        <FileJson size={13} /> GeoJSON
      </a>
      <a
        href={exportUrl(jobId, 'csv')}
        download
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted hover:text-white hover:border-green-500 transition-colors"
      >
        <Table size={13} /> CSV
      </a>
    </div>
  )
}
