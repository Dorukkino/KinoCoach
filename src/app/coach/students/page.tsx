import { Suspense } from "react";
import { StudentsPageContent } from "./StudentsPageContent";
import { StudentsListSkeleton } from "@/presentation/components/skeletons";

export default function CoachStudentsPage() {
  return (
    <Suspense fallback={<StudentsListSkeleton />}>
      <StudentsPageContent />
    </Suspense>
  );
}
