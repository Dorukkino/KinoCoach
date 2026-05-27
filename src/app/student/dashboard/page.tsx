import { Suspense } from "react";
import { StudentDashboardRealtime } from "./StudentDashboardRealtime";
import { StudentDashboardContent } from "./StudentDashboardContent";
import { StudentDashboardSkeleton } from "@/presentation/components/skeletons";

export default function StudentDashboardPage() {
  return (
    <div className="screen">
      <StudentDashboardRealtime />
      <div className="page-head">
        <div className="page-title">
          <h1>Merhaba</h1>
        </div>
      </div>
      <Suspense fallback={<StudentDashboardSkeleton />}>
        <StudentDashboardContent />
      </Suspense>
    </div>
  );
}
