import { Suspense } from "react";
import { StudentExamsContent } from "./StudentExamsContent";
import { GenericPageSkeleton } from "@/presentation/components/skeletons";

export default function StudentExamsPage() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Deneme Netlerim</h1>
        </div>
      </div>
      <Suspense fallback={<GenericPageSkeleton />}>
        <StudentExamsContent />
      </Suspense>
    </div>
  );
}
