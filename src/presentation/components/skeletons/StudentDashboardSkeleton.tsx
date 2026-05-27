import { Skeleton } from "../ui/Skeleton";

export function StudentDashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-3 w-48 mb-4" />
      <div className="panel p-6 mb-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </>
  );
}
