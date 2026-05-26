import Link from "next/link";
import { StudentCardDto } from "@/application/dto";
import { UserAvatar } from "../ui/UserAvatar";

const statusClass: Record<string, string> = {
  green: "good",
  yellow: "warn",
  red: "risk",
};

export function StudentCard({
  student,
  showStatus = true,
  onDelete,
}: {
  student: StudentCardDto;
  showStatus?: boolean;
  onDelete?: (id: string) => void;
}) {
  const legacy = statusClass[student.status] ?? "warn";

  return (
    <div className="student-card" style={{ position: "relative" }}>
      {/* Silme butonu */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(student.id)}
          title="Öğrenciyi sil"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            cursor: "pointer",
            zIndex: 1,
            transition: "color 120ms, border-color 120ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--risk)";
            e.currentTarget.style.borderColor = "var(--risk)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          ×
        </button>
      )}

      <div className="flex items-start gap-3 mb-3">
        <UserAvatar name={student.name} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[15px] m-0 truncate">{student.name}</h3>
          {(student.grade || student.track) && (
            <p className="text-xs text-[var(--muted)] m-0 mt-0.5">
              {[student.grade, student.track].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {showStatus && (
          <span className={`status-pill s-${student.status}`} style={{ marginRight: onDelete ? 28 : 0 }}>
            <span className={`dot-st ${legacy}`} />
            {student.statusLabel}
          </span>
        )}
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[var(--muted)]">Tamamlama</span>
          <span className="font-semibold">%{student.completionPercent}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className={`h-full rounded-full s-${student.status}`}
            style={{
              width: `${student.completionPercent}%`,
              background: `var(--${legacy === "good" ? "good" : legacy === "warn" ? "warn" : "risk"})`,
            }}
          />
        </div>
      </div>
      <p className="text-xs text-[var(--muted)] m-0 mb-3">
        Son aktif: {student.lastActive ?? "—"}
      </p>
      <div className="flex gap-2">
        <Link href={`/coach/students/${student.id}`} className="btn btn-primary text-xs flex-1 justify-center">
          Profil
        </Link>
        <Link href={`/coach/chat?student=${student.id}`} className="btn btn-outline text-xs">
          Mesaj
        </Link>
      </div>
    </div>
  );
}
