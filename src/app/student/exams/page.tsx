import { Suspense } from "react";
import { StudentExamsContent } from "./StudentExamsContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function StudentExamsPage() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Deneme Netlerim</h1>
        </div>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <StudentExamsContent />
      </Suspense>
    </div>
  );
}
