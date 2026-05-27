import { Skeleton } from "../ui/Skeleton";
import { WeeklyGridSkeleton } from "./WeeklyGridSkeleton";

export function StudentDashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-40 mb-4" />
      <div className="panel p-6 mb-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="panel p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full mb-4" />
        <WeeklyGridSkeleton />
      </div>
    </>
  );
}
