"use client";

import { MessageDto } from "@/application/dto";
import { ChatPanel } from "@/presentation/components/chat/ChatPanel";
import { useChatUnreadCountsBySender } from "@/presentation/hooks/useChatUnreadCounts";

export function StudentChatClient({
  studentUserId,
  coachUserId,
  coachName,
  initialMessages,
}: {
  studentUserId: string;
  coachUserId: string;
  coachName: string;
  initialMessages?: MessageDto[];
}) {
  const { unreadCounts, reload: reloadUnreadCounts, clearSender } =
    useChatUnreadCountsBySender(studentUserId);
  const unreadCount = unreadCounts[coachUserId] ?? 0;

  return (
    <div className="student-chat-shell">
      {unreadCount > 0 && (
        <span className="student-chat-floating-unread">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <ChatPanel
        currentUserId={studentUserId}
        otherUserId={coachUserId}
        otherUserName={coachName}
        visualVariant="student"
        onLastMessage={() => undefined}
        onThreadRead={(userId) => {
          clearSender(userId);
          window.setTimeout(() => void reloadUnreadCounts(), 800);
        }}
        initialMessages={initialMessages}
      />
    </div>
  );
}
