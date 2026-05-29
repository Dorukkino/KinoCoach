import { Suspense } from "react";
import { StudentWeeklyContent } from "./StudentWeeklyContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function StudentWeeklyPage() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Haftalık Programım</h1>
          <p>Görevleri tamamladıkça işaretleyin</p>
        </div>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <StudentWeeklyContent />
      </Suspense>
    </div>
  );
}
