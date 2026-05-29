"use client";

import { useState } from "react";
import { MessageDto } from "@/application/dto";
import { ChatPanel } from "@/presentation/components/chat/ChatPanel";
import { formatChatTimestamp } from "@/lib/dates";
import { useChatUnreadCountsBySender } from "@/presentation/hooks/useChatUnreadCounts";

export function StudentChatClient({
  studentUserId,
  coachUserId,
  coachName,
  initialLastTimestamp,
  initialMessages,
}: {
  studentUserId: string;
  coachUserId: string;
  coachName: string;
  initialLastTimestamp?: string;
  initialMessages?: MessageDto[];
}) {
  const [lastMessage, setLastMessage] = useState<string | undefined>();
  const [lastTimestamp, setLastTimestamp] = useState<string | undefined>(
    initialLastTimestamp
  );
  const { unreadCounts, reload: reloadUnreadCounts, clearSender } =
    useChatUnreadCountsBySender(studentUserId);
  const unreadCount = unreadCounts[coachUserId] ?? 0;

  const handleLastMessage = (
    _userId: string,
    text: string,
    createdAt: string
  ) => {
    setLastMessage(text);
    setLastTimestamp(createdAt);
  };

  return (
    <div className="chat-layout">
      {/* Sol panel — koç kartı */}
      <div className="panel p-2 overflow-y-auto max-h-[520px]">
        <div
          className="w-full text-left p-3 rounded-lg bg-[var(--accent-soft)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-sm font-medium truncate min-w-0"
              style={{ color: "var(--accent-ink)" }}
            >
              {coachName}
            </span>
            {unreadCount > 0 && (
              <span className="chat-unread-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {lastTimestamp && (
              <span
                className="text-[10px] flex-shrink-0"
                style={{ color: "var(--muted)" }}
                title={new Date(lastTimestamp).toLocaleString("tr-TR")}
              >
                {formatChatTimestamp(lastTimestamp)}
              </span>
            )}
          </div>
          {lastMessage && (
            <div
              className="text-xs truncate mt-0.5"
              style={{ color: "var(--muted)" }}
            >
              {lastMessage}
            </div>
          )}
        </div>
      </div>

      {/* Sağ panel — sohbet */}
      <ChatPanel
        currentUserId={studentUserId}
        otherUserId={coachUserId}
        otherUserName={coachName}
        onLastMessage={handleLastMessage}
        onThreadRead={(userId) => {
          clearSender(userId);
          window.setTimeout(() => void reloadUnreadCounts(), 800);
        }}
        initialMessages={initialMessages}
      />
    </div>
  );
}
