import { Suspense } from "react";
import { CoachDashboardRealtime } from "./CoachDashboardRealtime";
import { CoachDashboardContent } from "./CoachDashboardContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function CoachDashboardPage() {
  return (
    <div className="screen">
      <CoachDashboardRealtime />
      <div className="page-head">
        <div className="page-title">
          <h1>Dashboard</h1>
        </div>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <CoachDashboardContent />
      </Suspense>
    </div>
  );
}
