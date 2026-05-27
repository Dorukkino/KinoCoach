import { Skeleton } from "../ui/Skeleton";

export function StudentLinkListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="panel p-4">
            <Skeleton className="h-4 w-40" />
          </div>
        </li>
      ))}
    </ul>
  );
}
