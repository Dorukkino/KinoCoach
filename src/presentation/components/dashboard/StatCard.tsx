export function StatCard({
  label,
  value,
  sub,
  tone = "accent",
  icon = "people",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "accent" | "good" | "warn" | "risk";
  icon?: "people" | "check" | "clock" | "alert";
}) {
  const iconSvg = {
    people: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 18.5c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
        <circle cx="12" cy="8" r="3.5" />
        <path d="M19 17c0-1.7-1.1-3.1-2.6-3.7" />
        <path d="M16.8 5.7a2.5 2.5 0 0 1 0 4.6" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.3 2.2 2.2 4.8-5" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 1.8" />
      </svg>
    ),
    alert: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4 4 18h16L12 4Z" />
        <path d="M12 9v4" />
        <path d="M12 16.5h.01" />
      </svg>
    ),
  }[icon];

  return (
    <div className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-icon">{iconSvg}</span>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-bottom">
        {sub && <span>{sub}</span>}
      </div>
      <div className="stat-spark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
