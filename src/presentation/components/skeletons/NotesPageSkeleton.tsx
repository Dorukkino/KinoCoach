import { Skeleton } from "../ui/Skeleton";
import { SkeletonAvatar } from "../ui/SkeletonAvatar";

export function NotesPageSkeleton() {
  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
      <div className="panel p-3 flex flex-col gap-2">
        <Skeleton className="h-9 w-full mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <SkeletonAvatar size={28} />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
      <div className="panel p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
