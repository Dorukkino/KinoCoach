import { Skeleton } from "../ui/Skeleton";
import { SkeletonText } from "../ui/SkeletonText";

export function GenericPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <SkeletonText lines={2} />
      <div className="panel p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
