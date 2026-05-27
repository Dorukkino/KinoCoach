export function Skeleton({
  className = "",
  shimmer = true,
  style,
}: {
  className?: string;
  shimmer?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[var(--radius-sm)] bg-[var(--border)] ${
        shimmer ? "skeleton-shimmer" : "animate-pulse"
      } ${className}`}
      style={style}
      aria-hidden
    />
  );
}
