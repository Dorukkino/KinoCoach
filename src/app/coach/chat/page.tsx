import { Suspense } from "react";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";
import { CoachChatContent } from "./CoachChatContent";

export default function CoachChatPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  return (
    <div className="screen coach-chat-screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Chat</h1>
          <p>Öğrencilerinizle gerçek zamanlı iletişim</p>
        </div>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <CoachChatPageInner searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CoachChatPageInner({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: studentId } = await searchParams;
  return <CoachChatContent selectedStudentId={studentId} />;
}
