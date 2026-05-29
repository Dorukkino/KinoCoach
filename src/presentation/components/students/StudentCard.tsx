import Link from "next/link";
import { StudentCardDto } from "@/application/dto";
import { UserAvatar } from "../ui/UserAvatar";

const statusClass: Record<string, string> = {
  green: "good",
  yellow: "warn",
  red: "risk",
};

const statusTone: Record<string, string> = {
  green: "green",
  yellow: "yellow",
  red: "red",
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
  const tone = statusTone[student.status] ?? "yellow";
  const subtitle = [student.grade, student.track].filter(Boolean).join(" · ");

  return (
    <article className={`student-card student-card-${tone}`}>
      <div className="student-card-menu" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="student-card-head">
        <UserAvatar name={student.name} size={42} />
        <div className="student-card-title">
          <h3>{student.name}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="student-card-metrics">
        <div>
          <span>Son giriş</span>
          <strong>{student.lastActive ?? "—"}</strong>
        </div>
      </div>

      <div className="student-card-progress">
        <div className="student-card-progress-label">
          <span>Görev tamamlanma</span>
          <strong>{student.completionPercent}%</strong>
        </div>
        <div className="student-progress-track">
          <span
            className={`student-progress-fill ${legacy}`}
            style={{ width: `${student.completionPercent}%` }}
          />
        </div>
      </div>

      {showStatus && (
        <span className={`status-pill s-${student.status}`}>
          <span className={`dot-st ${legacy}`} />
          {student.statusLabel}
        </span>
      )}

      <div className={`student-card-actions${onDelete ? "" : " no-delete"}`}>
        <Link href={`/coach/students/${student.id}`} className="student-card-primary-action">
          Profili Aç
        </Link>
        <Link
          href={`/coach/chat?student=${student.id}`}
          className="student-card-icon-action"
          title="Mesaj gönder"
          aria-label={`${student.name} için mesajları aç`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 6h14v10H8l-3 3V6Z" />
          </svg>
        </Link>
        {onDelete && (
          <button
            type="button"
            className="student-card-icon-action danger"
            onClick={() => onDelete(student.id)}
            title="Öğrenciyi sil"
            aria-label={`${student.name} öğrencisini sil`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 7h12" />
              <path d="M10 11v6M14 11v6" />
              <path d="M8 7l1 12h6l1-12" />
              <path d="M10 7V5h4v2" />
            </svg>
          </button>
        )}
      </div>
    </article>
  );
}
