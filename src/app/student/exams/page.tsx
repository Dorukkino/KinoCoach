import { Suspense } from "react";
import { StudentExamsContent } from "./StudentExamsContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function StudentExamsPage() {
  return (
    <div className="screen">
      <Suspense fallback={<LoadingScreen />}>
        <StudentExamsContent />
      </Suspense>
    </div>
  );
}
