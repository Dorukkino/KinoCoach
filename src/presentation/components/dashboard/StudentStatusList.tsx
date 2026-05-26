import { StudentCardDto } from "@/application/dto";
import { UserAvatar } from "../ui/UserAvatar";
import Link from "next/link";

const statusClass: Record<string, string> = {
  green: "good",
  yellow: "warn",
  red: "risk",
};

export function StudentStatusList({ students }: { students: StudentCardDto[] }) {
  return (
    <div className="panel p-4">
      <h3 className="font-semibold text-[15px] m-0 mb-3">Öğrenci durumları</h3>
      <ul className="list-none m-0 p-0 flex flex-col gap-2">
        {students.map((s) => (
          <li key={s.id}>
            <Link
              href={`/coach/students/${s.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg)]"
            >
              <UserAvatar name={s.name} size={36} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block truncate">{s.name}</span>
                <span className="text-xs text-[var(--muted)] block truncate">
                  %{s.completionPercent} tamamlama · Son aktif: {s.lastActive ?? "—"}
                </span>
              </div>
              <span className={`dot-st ${statusClass[s.status]}`} title={s.statusLabel} />
            </Link>
          </li>
        ))}
        {students.length === 0 && (
          <li className="text-sm text-[var(--muted)]">Henüz öğrenci yok.</li>
        )}
      </ul>
    </div>
  );
}
