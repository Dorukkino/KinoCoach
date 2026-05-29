"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageDto, StudentCardDto } from "@/application/dto";
import { ChatPanel } from "@/presentation/components/chat/ChatPanel";
import { formatChatTimestamp } from "@/lib/dates";
import { useChatUnreadCountsBySender } from "@/presentation/hooks/useChatUnreadCounts";

export function CoachChatClient({
  coachUserId,
  students,
  selectedStudentId,
  initialLastTimestamps = {},
  initialMessages,
}: {
  coachUserId: string;
  students: StudentCardDto[];
  selectedStudentId?: string;
  initialLastTimestamps?: Record<string, string>;
  initialMessages?: MessageDto[];
}) {
  const [activeId, setActiveId] = useState(selectedStudentId ?? students[0]?.id);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [lastTimestamps, setLastTimestamps] = useState<Record<string, string>>(
    initialLastTimestamps
  );
  const { unreadCounts, reload: reloadUnreadCounts, clearSender } =
    useChatUnreadCountsBySender(coachUserId);
  const active = students.find((s) => s.id === activeId);

  if (students.length === 0) {
    return <p className="text-[var(--muted)]">Henüz öğrenci yok.</p>;
  }

  const handleLastMessage = (
    userId: string,
    text: string,
    createdAt: string
  ) => {
    setLastMessages((prev) => ({ ...prev, [userId]: text }));
    setLastTimestamps((prev) => ({ ...prev, [userId]: createdAt }));
  };

  return (
    <div className="chat-layout">
      {/* Sol liste */}
      <div className="panel p-2 overflow-y-auto max-h-[520px]">
        {students.map((s) => {
          const last = s.userId ? lastMessages[s.userId] : undefined;
          const ts = s.userId ? lastTimestamps[s.userId] : undefined;
          const unreadCount = s.userId ? unreadCounts[s.userId] ?? 0 : 0;
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
                activeId === s.id
                  ? "bg-[var(--accent-soft)]"
                  : "hover:bg-[var(--bg)]"
              }`}
              onClick={() => setActiveId(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveId(s.id);
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/coach/students/${s.id}`}
                  className="text-sm font-medium truncate hover:underline min-w-0"
                  style={{ color: activeId === s.id ? "var(--accent-ink)" : "var(--ink)" }}
                  title="Öğrenci profilini aç"
                  onClick={(e) => e.stopPropagation()}
                >
                  {s.name}
                </Link>
                {unreadCount > 0 && (
                  <span className="chat-unread-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {ts && (
                  <span
                    className="text-[10px] flex-shrink-0"
                    style={{ color: "var(--muted)" }}
                    title={new Date(ts).toLocaleString("tr-TR")}
                  >
                    {formatChatTimestamp(ts)}
                  </span>
                )}
              </div>
              {last && (
                <div
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--muted)" }}
                >
                  {last}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sağ panel */}
      {active?.userId && (
        <ChatPanel
          currentUserId={coachUserId}
          otherUserId={active.userId}
          otherUserName={active.name}
          profileHref={`/coach/students/${active.id}`}
          onLastMessage={handleLastMessage}
          onThreadRead={(userId) => {
            clearSender(userId);
            window.setTimeout(() => void reloadUnreadCounts(), 800);
          }}
          initialMessages={
            active.id === selectedStudentId ? initialMessages : undefined
          }
        />
      )}
    </div>
  );
}
