import { Suspense } from "react";
import { StudentDashboardRealtime } from "./StudentDashboardRealtime";
import { StudentDashboardContent } from "./StudentDashboardContent";
import { StudentDashboardSkeleton } from "@/presentation/components/skeletons";
import { getStudentDashboardWithInvitationsAction } from "@/app/actions/dashboard";

async function StudentDashboardLoader() {
  const { dashboard, invitations } =
    await getStudentDashboardWithInvitationsAction();
  if (!dashboard) return <div>Profil bulunamadı.</div>;
  return (
    <StudentDashboardContent dashboard={dashboard} invitations={invitations} />
  );
}

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
        <StudentDashboardLoader />
      </Suspense>
    </div>
  );
}
