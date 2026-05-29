import { getCoachDashboardAction } from "@/app/actions/dashboard";
import { StatCard } from "@/presentation/components/dashboard/StatCard";
import { StudentStatusList } from "@/presentation/components/dashboard/StudentStatusList";

export async function CoachDashboardContent() {
  const data = await getCoachDashboardAction();
  if (!data) return null;

  const { stats, students } = data;

  return (
    <>
      <p className="text-sm text-[var(--muted)] m-0 mb-4">
        {stats.totalStudents} öğrenci
      </p>
      <div className="stats-row">
        <StatCard label="Toplam öğrenci" value={stats.totalStudents} />
        <StatCard label="İyi gidiyor" value={stats.greenCount} sub="≥ %80" />
        <StatCard label="Ortalama" value={stats.yellowCount} sub="%50–79" />
        <StatCard label="Riskli" value={stats.redCount} sub="&lt; %50" />
      </div>
      <div className="grid gap-4">
        <StudentStatusList students={students} />
      </div>
    </>
  );
}
