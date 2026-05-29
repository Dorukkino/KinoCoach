import { Suspense } from "react";
import { CoachDashboardRealtime } from "./CoachDashboardRealtime";
import { CoachDashboardContent } from "./CoachDashboardContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function CoachDashboardPage() {
  return (
    <div className="screen">
      <CoachDashboardRealtime />
      <Suspense fallback={<LoadingScreen />}>
        <CoachDashboardContent />
      </Suspense>
    </div>
  );
}
