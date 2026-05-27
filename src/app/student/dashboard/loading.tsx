import { StudentDashboardSkeleton } from "@/presentation/components/skeletons";

export default function StudentDashboardLoading() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Dashboard</h1>
        </div>
      </div>
      <StudentDashboardSkeleton />
    </div>
  );
}
