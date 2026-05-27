import { Skeleton } from "../ui/Skeleton";
import { SkeletonAvatar } from "../ui/SkeletonAvatar";

export function StudentDetailSkeleton() {
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <SkeletonAvatar size={56} />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <div className="flex gap-1 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-none" />
        ))}
      </div>
      <div className="panel p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </>
  );
}
