import { Suspense } from "react";
import { StudentsPageContent } from "./StudentsPageContent";
import { StudentsCachedFallback } from "./StudentsCachedFallback";

export default function CoachStudentsPage() {
  return (
    <Suspense fallback={<StudentsCachedFallback />}>
      <StudentsPageContent />
    </Suspense>
  );
}
