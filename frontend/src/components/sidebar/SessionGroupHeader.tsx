export function SessionGroupHeader({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2.5 pt-3 pb-1.5 first:pt-1">
      {label}
    </p>
  )
}
