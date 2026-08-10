import { Skeleton } from "../ui/Skeleton"

export function ChatMessagesSkeleton() {
  return (
    <div className="max-w-[820px] mx-auto w-full px-4 md:px-6 py-6 space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`flex gap-3 ${i === 1 ? "justify-end" : ""}`}>
          {i !== 1 && <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />}
          <div className={`space-y-2 ${i === 1 ? "w-1/3" : "w-2/3"}`}>
            <Skeleton className="h-16 rounded-2xl w-full" />
          </div>
          {i === 1 && <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}
