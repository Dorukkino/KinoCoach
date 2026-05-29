import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";
import { CoachWeeklyContent } from "./CoachWeeklyContent";

export default function CoachWeeklyPage() {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="coach-weekly"
        tables={["weekly_programs", "students", "coaching_engagements"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Haftalık Program</h1>
          <p>Öğrenci profilinden haftalık programı düzenleyin</p>
        </div>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <CoachWeeklyContent />
      </Suspense>
    </div>
  );
}
