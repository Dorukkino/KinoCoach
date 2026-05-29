import { Suspense } from "react";
import { StudentLessonNetsContent } from "./StudentLessonNetsContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function StudentLessonNetsPage() {
  return (
    <div className="screen">
      <Suspense fallback={<LoadingScreen />}>
        <StudentLessonNetsContent />
      </Suspense>
    </div>
  );
}
