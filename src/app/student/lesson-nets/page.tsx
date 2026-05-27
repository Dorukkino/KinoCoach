import { Suspense } from "react";
import { StudentLessonNetsContent } from "./StudentLessonNetsContent";
import { GenericPageSkeleton } from "@/presentation/components/skeletons";

export default function StudentLessonNetsPage() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Soru Çözüm Listem</h1>
          <p>Haftalık çözüm kayıtlarınız</p>
        </div>
      </div>
      <Suspense fallback={<GenericPageSkeleton />}>
        <StudentLessonNetsContent />
      </Suspense>
    </div>
  );
}
