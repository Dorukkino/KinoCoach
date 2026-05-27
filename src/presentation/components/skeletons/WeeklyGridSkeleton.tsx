import { Skeleton } from "../ui/Skeleton";

export function WeeklyGridSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: "repeat(11, minmax(52px, 1fr))" }}>
        {Array.from({ length: 77 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full min-w-[52px]" />
        ))}
      </div>
    </div>
  );
}
