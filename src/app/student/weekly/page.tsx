import { Suspense } from "react";
import { StudentWeeklyContent } from "./StudentWeeklyContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function StudentWeeklyPage() {
  return (
    <div className="screen student-weekly-screen">
      <Suspense fallback={<LoadingScreen />}>
        <StudentWeeklyContent />
      </Suspense>
    </div>
  );
}
