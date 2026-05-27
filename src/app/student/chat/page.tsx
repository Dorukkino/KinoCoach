import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { ChatPageSkeleton } from "@/presentation/components/skeletons";
import { StudentChatContent } from "./StudentChatContent";

export default function StudentChatPage() {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="student-chat"
        tables={["messages", "coaching_engagements"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Chat</h1>
        </div>
      </div>
      <Suspense fallback={<ChatPageSkeleton />}>
        <StudentChatContent />
      </Suspense>
    </div>
  );
}
