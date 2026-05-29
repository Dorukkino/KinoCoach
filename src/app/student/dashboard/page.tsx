import { Suspense } from "react";
import { StudentDashboardRealtime } from "./StudentDashboardRealtime";
import { StudentDashboardContent } from "./StudentDashboardContent";
import { getStudentDashboardWithInvitationsAction } from "@/app/actions/dashboard";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

async function StudentDashboardLoader() {
  const { dashboard, invitations } =
    await getStudentDashboardWithInvitationsAction();
  if (!dashboard) return <div>Profil bulunamadı.</div>;
  return (
    <>
      <StudentDashboardRealtime studentId={dashboard.studentId} />
      <StudentDashboardContent dashboard={dashboard} invitations={invitations} />
    </>
  );
}

export default function StudentDashboardPage() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Merhaba</h1>
        </div>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <StudentDashboardLoader />
      </Suspense>
    </div>
  );
}
