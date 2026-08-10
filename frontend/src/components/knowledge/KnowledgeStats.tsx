import type { Document } from "../../types"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface StatTileProps {
  label: string
  value: string | number
  tone?: "default" | "green"
}

function StatTile({ label, value, tone = "default" }: StatTileProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
      <p className={`text-lg font-semibold ${tone === "green" ? "text-emerald-400" : "text-zinc-100"}`}>
        {value}
      </p>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

export function KnowledgeStats({ documents }: { documents: Document[] | undefined }) {
  const total = documents?.length ?? 0
  const ready = documents?.filter((d) => d.status === "processed").length ?? 0
  const storageBytes = documents?.reduce((sum, d) => sum + d.size, 0) ?? 0

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile label="Documents" value={total} />
      <StatTile label="Ready" value={ready} tone="green" />
      <StatTile label="Storage" value={formatBytes(storageBytes)} />
    </div>
  )
}
