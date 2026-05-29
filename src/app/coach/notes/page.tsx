import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { CoachNotesContent } from "./CoachNotesContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function CoachNotesPage() {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="coach-notes"
        tables={["coach_notes", "students", "coaching_engagements"]}
      />
      <Suspense fallback={<LoadingScreen />}>
        <CoachNotesContent />
      </Suspense>
    </div>
  );
}
