import { listActiveStudentsAction } from "@/app/actions/students";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";
import Link from "next/link";

export async function CoachWeeklyContent() {
  const students = await listActiveStudentsAction();
  const totalStudents = students.length;
  const averageCompletion =
    totalStudents === 0
      ? 0
      : Math.round(
          students.reduce((sum, student) => sum + student.completionPercent, 0) /
            totalStudents
        );
  const needsAttention = students.filter(
    (student) => student.status === "red" || student.completionPercent < 40
  ).length;

  return (
    <section className="coach-weekly-picker" aria-label="Haftalık program öğrenci seçimi">
      <div className="coach-weekly-summary">
        <div>
          <span>Aktif öğrenci</span>
          <strong>{totalStudents}</strong>
        </div>
        <div>
          <span>Ortalama tamamlama</span>
          <strong>%{averageCompletion}</strong>
        </div>
        <div>
          <span>Yakından izlenecek</span>
          <strong>{needsAttention}</strong>
        </div>
      </div>

      <div className="coach-weekly-grid">
        {students.map((student) => {
          const subtitle = [student.grade, student.track].filter(Boolean).join(" · ");
          const href = `/coach/students/${student.id}?tab=weekly`;
          const progressTone =
            student.status === "green"
              ? "good"
              : student.status === "red"
                ? "risk"
                : "warn";

          return (
            <Link
              key={student.id}
              href={href}
              className={`coach-weekly-student-card coach-weekly-student-${student.status}`}
              aria-label={`${student.name} haftalık programını aç`}
            >
              <div className="coach-weekly-student-head">
                <UserAvatar name={student.name} size={42} />
                <div>
                  <h2>{student.name}</h2>
                  <p>{subtitle || "Öğrenci"}</p>
                </div>
              </div>

              <div className="coach-weekly-student-progress">
                <div>
                  <span>Görev tamamlanma</span>
                  <strong>%{student.completionPercent}</strong>
                </div>
                <div className="student-progress-track">
                  <span
                    className={`student-progress-fill ${progressTone}`}
                    style={{ width: `${student.completionPercent}%` }}
                  />
                </div>
              </div>

              <div className="coach-weekly-student-footer">
                <span className={`status-pill s-${student.status}`}>
                  <span className={`dot-st ${progressTone}`} />
                  {student.statusLabel}
                </span>
                <span className="coach-weekly-open">Haftalık Programı Aç</span>
              </div>
            </Link>
          );
        })}

        {students.length === 0 && (
          <div className="coach-weekly-empty">
            Henüz aktif öğrenci bulunmuyor.
          </div>
        )}
      </div>
    </section>
  );
}
