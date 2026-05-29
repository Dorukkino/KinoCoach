import { StudentCardDto } from "@/application/dto";
import { UserAvatar } from "../ui/UserAvatar";
import Link from "next/link";

const statusClass: Record<string, string> = {
  green: "good",
  yellow: "warn",
  red: "risk",
};

export function StudentStatusList({ students }: { students: StudentCardDto[] }) {
  const statusCounts = students.reduce(
    (acc, student) => {
      acc[student.status] = (acc[student.status] ?? 0) + 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 } as Record<StudentCardDto["status"], number>
  );

  return (
    <div className="panel dashboard-panel status-panel">
      <div className="dashboard-panel-head">
        <div>
          <h3>Öğrenci Durumları</h3>
          <p>Öğrencilerinizin durumunu buradan kontrol edin</p>
        </div>
        <div className="status-summary" aria-label="Öğrenci durum özeti">
          <span>Tümü</span>
          <span><i className="dot-st good" />{statusCounts.green}</span>
          <span><i className="dot-st warn" />{statusCounts.yellow}</span>
          <span><i className="dot-st risk" />{statusCounts.red}</span>
        </div>
      </div>
      <ul className="student-status-list">
        {students.map((s) => (
          <li key={s.id}>
            <Link
              href={`/coach/students/${s.id}`}
              className="student-status-row"
            >
              <UserAvatar name={s.name} size={34} />
              <div className="student-status-main">
                <span className="student-name">{s.name}</span>
                <span className="student-meta">
                  {s.grade ?? "Seviye yok"} · {s.track ?? "Alan yok"} · {s.lastActive ?? "Aktivite yok"}
                </span>
              </div>
              <div className="student-progress">
                <div className="progress-line">
                  <span
                    className={`progress-fill ${statusClass[s.status]}`}
                    style={{ width: `${Math.min(100, Math.max(0, s.completionPercent))}%` }}
                  />
                </div>
                <span>%{s.completionPercent}</span>
              </div>
              <span className={`status-pill s-${s.status}`} title={s.statusLabel}>
                {s.statusLabel}
              </span>
            </Link>
          </li>
        ))}
        {students.length === 0 && (
          <li className="empty-copy">Henüz öğrenci yok.</li>
        )}
      </ul>
    </div>
  );
}
