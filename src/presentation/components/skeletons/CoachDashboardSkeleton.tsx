import { Skeleton } from "../ui/Skeleton";
import { SkeletonAvatar } from "../ui/SkeletonAvatar";

export function CoachDashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="stats-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="panel p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <SkeletonAvatar size={36} />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
          ))}
        </div>
        <div className="panel p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 py-2 border-b border-[var(--border)] last:border-0">
              <Skeleton className="h-3.5 w-full max-w-[280px]" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
