import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { CoachNotesContent } from "./CoachNotesContent";
import { NotesPageSkeleton } from "@/presentation/components/skeletons";

export default function CoachNotesPage() {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="coach-notes"
        tables={["coach_notes", "students", "coaching_engagements"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Notlar</h1>
          <p>Öğrenci bazlı özel koç notları</p>
        </div>
      </div>
      <Suspense fallback={<NotesPageSkeleton />}>
        <CoachNotesContent />
      </Suspense>
    </div>
  );
}
