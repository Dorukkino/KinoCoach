import { Skeleton } from "./Skeleton";

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <Skeleton
      className="rounded-full shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
