import { Suspense } from "react";
import { StudentDetailContent } from "./StudentDetailContent";
import { StudentDetailSkeleton } from "@/presentation/components/skeletons";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<StudentDetailSkeleton />}>
      <StudentDetailPageInner params={params} />
    </Suspense>
  );
}

async function StudentDetailPageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentDetailContent studentId={id} />;
}
