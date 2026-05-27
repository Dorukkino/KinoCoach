import { Skeleton } from "../ui/Skeleton";
import { SkeletonAvatar } from "../ui/SkeletonAvatar";

export function ChatPageSkeleton() {
  return (
    <div className="chat-layout">
      <div className="panel p-3 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <SkeletonAvatar size={32} />
            <Skeleton className="h-3.5 flex-1 max-w-[120px]" />
          </div>
        ))}
      </div>
      <div className="panel flex flex-col min-h-[480px]">
        <div className="p-4 border-b border-[var(--border)]">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4 flex flex-col gap-3">
          <Skeleton className="h-10 w-2/3 self-start rounded-[14px]" />
          <Skeleton className="h-10 w-1/2 self-end rounded-[14px]" />
          <Skeleton className="h-10 w-3/5 self-start rounded-[14px]" />
        </div>
        <div className="p-3 border-t border-[var(--border)]">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
