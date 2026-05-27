import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { StudentLinkListSkeleton } from "@/presentation/components/skeletons";
import { CoachExamsContent } from "./CoachExamsContent";

export default function CoachExamsPage() {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="coach-exams"
        tables={["exam_results", "students", "coaching_engagements"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Deneme Netleri</h1>
          <p>Öğrenci detayından deneme ekleyin ve grafikleri görün</p>
        </div>
      </div>
      <Suspense fallback={<StudentLinkListSkeleton />}>
        <CoachExamsContent />
      </Suspense>
    </div>
  );
}
