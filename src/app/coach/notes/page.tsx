import { listCoachNotesAction } from "@/app/actions/notes";
import Link from "next/link";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";

function truncateNote(note: string, max = 120) {
  const trimmed = note.trim();
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export default async function CoachNotesPage() {
  const items = await listCoachNotesAction();

  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Notlar</h1>
          <p>Öğrenci bazlı özel koç notları</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-[var(--muted)]">
          Henüz öğrenci yok.
        </div>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {items.map((item) => {
            const preview = truncateNote(item.note);

            return (
              <li key={item.studentId}>
                <Link
                  href={`/coach/students/${item.studentId}?tab=notes`}
                  className="panel p-4 block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar name={item.studentName} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-sm">{item.studentName}</span>
                        <span className="text-xs text-[var(--muted-2)] flex-shrink-0">
                          {preview ? "Düzenle →" : "Not ekle →"}
                        </span>
                      </div>
                      {preview ? (
                        <p className="text-sm text-[var(--muted)] m-0 mt-1.5 leading-snug line-clamp-2">
                          {preview}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--muted-2)] m-0 mt-1.5 italic">
                          Henüz not yazılmamış
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
