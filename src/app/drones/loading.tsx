import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="mt-5 h-12 w-3/4 rounded-2xl" />
      <Skeleton className="mt-4 h-5 w-1/2 rounded-xl" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[28px] border border-line bg-surface p-5">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="mt-5 h-6 w-1/2 rounded-lg" />
            <Skeleton className="mt-3 h-4 w-3/4 rounded-lg" />
            <Skeleton className="mt-6 h-12 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
