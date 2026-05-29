import Link from "next/link";

export function AdminStatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "good" | "warn" | "risk";
}) {
  const color =
    tone === "good"
      ? "text-[var(--good-ink)]"
      : tone === "warn"
        ? "text-[var(--warn-ink)]"
        : tone === "risk"
          ? "text-[var(--risk-ink)]"
          : "text-[var(--ink)]";

  return (
    <div className="stat-card">
      <p className="text-xs text-[var(--muted)] m-0 mb-2">{label}</p>
      <p className={`text-2xl font-bold m-0 ${color}`}>
        {new Intl.NumberFormat("tr-TR").format(value)}
      </p>
    </div>
  );
}

export function AdminBadge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "warn" | "risk";
}) {
  const className =
    tone === "good"
      ? "status-pill s-green"
      : tone === "warn"
        ? "status-pill s-yellow"
        : tone === "risk"
          ? "status-pill s-red"
          : "status-pill bg-[var(--border)] text-[var(--ink-2)]";

  return <span className={className}>{children}</span>;
}

export function AdminTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] border-b border-[var(--border)] p-3">
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-b border-[var(--border)] p-3 align-top ${className}`}>
      {children}
    </td>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel p-8 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function AdminLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-[var(--accent-ink)] font-semibold">
      {children}
    </Link>
  );
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
