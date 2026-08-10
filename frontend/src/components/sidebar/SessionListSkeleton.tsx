import { Skeleton } from "../ui/Skeleton"

export function SessionListSkeleton() {
  return (
    <div className="space-y-1.5 px-0.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5 px-2.5 py-2.5">
          <Skeleton className="w-4 h-4 rounded-md mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
