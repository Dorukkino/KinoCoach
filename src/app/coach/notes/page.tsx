import { listCoachNotesAction } from "@/app/actions/notes";
import { listActiveStudentsAction } from "@/app/actions/students";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { CoachNotesClient } from "./CoachNotesClient";

export default async function CoachNotesPage() {
  const [students, notes] = await Promise.all([
    listActiveStudentsAction(),
    listCoachNotesAction(),
  ]);

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

      <CoachNotesClient students={students} notes={notes} />
    </div>
  );
}
