import { getCoachDashboardAction } from "@/app/actions/dashboard";
import { StatCard } from "@/presentation/components/dashboard/StatCard";
import { StudentStatusList } from "@/presentation/components/dashboard/StudentStatusList";
import { ActivityFeed } from "@/presentation/components/dashboard/ActivityFeed";
import { CoachDashboardRealtime } from "./CoachDashboardRealtime";

export default async function CoachDashboardPage() {
  const data = await getCoachDashboardAction();
  if (!data) return null;

  const { stats, students, activities } = data;

  return (
    <div className="screen">
      <CoachDashboardRealtime />
      <div className="page-head">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>{stats.totalStudents} öğrenci</p>
        </div>
      </div>
      <div className="stats-row">
        <StatCard label="Toplam öğrenci" value={stats.totalStudents} />
        <StatCard label="İyi gidiyor" value={stats.greenCount} sub="≥ %80" />
        <StatCard label="Ortalama" value={stats.yellowCount} sub="%50–79" />
        <StatCard label="Riskli" value={stats.redCount} sub="&lt; %50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <StudentStatusList students={students} />
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
