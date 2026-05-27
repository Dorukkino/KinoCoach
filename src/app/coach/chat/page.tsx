import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { ChatPageSkeleton } from "@/presentation/components/skeletons";
import { CoachChatContent } from "./CoachChatContent";

export default function CoachChatPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="coach-chat"
        tables={["messages", "coaching_engagements", "students"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Chat</h1>
          <p>Öğrencilerinizle mesajlaşın</p>
        </div>
      </div>
      <Suspense fallback={<ChatPageSkeleton />}>
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
