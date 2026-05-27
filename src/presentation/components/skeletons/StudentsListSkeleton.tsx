import { Skeleton } from "../ui/Skeleton";
import { SkeletonAvatar } from "../ui/SkeletonAvatar";

export function StudentsListSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="student-card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <SkeletonAvatar size={44} />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-2 mt-1">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
