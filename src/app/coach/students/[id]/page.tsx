import { Suspense } from "react";
import { StudentDetailContent } from "./StudentDetailContent";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export default function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="screen">
          <LoadingScreen />
        </div>
      }
    >
      <StudentDetailPageInner params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function StudentDetailPageInner({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <StudentDetailContent studentId={id} initialTab={tab} />;
}
