import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function CoachDashboardLoading() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Dashboard</h1>
        </div>
      </div>
      <LoadingScreen />
    </div>
  );
}
