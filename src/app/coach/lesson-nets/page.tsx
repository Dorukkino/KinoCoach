import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { StudentLinkListSkeleton } from "@/presentation/components/skeletons";
import { CoachLessonNetsContent } from "./CoachLessonNetsContent";

export default function CoachLessonNetsPage() {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="coach-lesson-nets"
        tables={["question_sessions", "students", "coaching_engagements"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Soru Çözüm Listesi</h1>
          <p>Öğrencilerin ders net girişlerini inceleyin</p>
        </div>
      </div>
      <Suspense fallback={<StudentLinkListSkeleton />}>
        <CoachLessonNetsContent />
      </Suspense>
    </div>
  );
}
