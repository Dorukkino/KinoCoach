import { Suspense } from "react";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";
import { StudentChatContent } from "./StudentChatContent";

export default function StudentChatPage() {
  return (
    <div className="screen student-chat-screen">
      <RealtimeRouteRefresh
        channelPrefix="student-chat"
        tables={["coaching_engagements"]}
      />
      <Suspense fallback={<LoadingScreen />}>
        <StudentChatContent />
      </Suspense>
    </div>
  );
}
