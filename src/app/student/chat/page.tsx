import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";
import { StudentChatContent } from "./StudentChatContent";

export default function StudentChatPage() {
  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="student-chat"
        tables={["coaching_engagements"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Chat</h1>
        </div>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <StudentChatContent />
      </Suspense>
    </div>
  );
}
