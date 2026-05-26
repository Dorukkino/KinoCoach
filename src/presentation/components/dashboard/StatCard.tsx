export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="stat-card">
      <span className="text-xs text-[var(--muted)] font-medium">{label}</span>
      <div className="text-2xl font-bold mt-1 tracking-tight">{value}</div>
      {sub && <span className="text-xs text-[var(--muted)] mt-1 block">{sub}</span>}
    </div>
  );
}
