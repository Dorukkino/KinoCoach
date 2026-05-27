import { Suspense } from "react";
import { CoachDashboardRealtime } from "./CoachDashboardRealtime";
import { CoachDashboardContent } from "./CoachDashboardContent";
import { CoachDashboardSkeleton } from "@/presentation/components/skeletons";

export default function CoachDashboardPage() {
  return (
    <div className="screen">
      <CoachDashboardRealtime />
      <div className="page-head">
        <div className="page-title">
          <h1>Dashboard</h1>
        </div>
      </div>
      <Suspense fallback={<CoachDashboardSkeleton />}>
        <CoachDashboardContent />
      </Suspense>
    </div>
  );
}
