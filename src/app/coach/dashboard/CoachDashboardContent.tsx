import { getCoachDashboardAction } from "@/app/actions/dashboard";
import { StatCard } from "@/presentation/components/dashboard/StatCard";
import { StudentStatusList } from "@/presentation/components/dashboard/StudentStatusList";
import Link from "next/link";

export async function CoachDashboardContent() {
  const data = await getCoachDashboardAction();
  if (!data) return null;

  const { stats, students, coachName } = data;
  const attentionCount = stats.yellowCount + stats.redCount;
  const today = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="coach-dashboard">
      <section className="coach-hero">
        <div>
          <p className="coach-hero-kicker">Koçluk panelinden son 24 saate hızlı bakış</p>
          <h1>Merhaba {coachName}</h1>
        </div>
        <span className="date-chip">{today}</span>
      </section>

      <div className="stats-row">
        <StatCard
          label="Toplam Öğrenci"
          value={stats.totalStudents}
          sub="aktif koçluk"
          tone="accent"
          icon="people"
        />
        <StatCard
          label="İyi Gidiyor"
          value={stats.greenCount}
          sub="≥ %80 tamamlama"
          tone="good"
          icon="check"
        />
        <StatCard
          label="Ortalama"
          value={stats.yellowCount}
          sub="%50–79 aralığı"
          tone="warn"
          icon="clock"
        />
        <StatCard
          label="Riskli"
          value={stats.redCount}
          sub="≤ %50 tamamlama"
          tone="risk"
          icon="alert"
        />
      </div>

      <section className="attention-strip">
        <div className="attention-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.5l-1.6-5.3L5 10.6 10.4 9 12 3.5Z" />
            <path d="M18.5 15.5 19.2 18l2.3.7-2.3.7-.7 2.1-.7-2.1-2.3-.7 2.3-.7.7-2.5Z" />
          </svg>
        </div>
        <p>
          <strong>{attentionCount} öğrenci için öncelik zamanı.</strong>{" "}
          Bugünün odak noktalarını belirleyip haftalık planları sakin ve net adımlarla gözden geçirin.
        </p>
        <Link href="/coach/students" className="attention-link">Öğrencilere git</Link>
      </section>

      <div className="dashboard-main-grid">
        <StudentStatusList students={students} />
      </div>
    </div>
  );
}
