"use client";

import { useState, useTransition } from "react";
import { MessageDto, StudentCardDto } from "@/application/dto";
import { deleteThreadMessagesAction } from "@/app/actions/messages";
import { ChatPanel } from "@/presentation/components/chat/ChatPanel";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";
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
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [chatResetKey, setChatResetKey] = useState(0);
  const [deletedThreadIds, setDeletedThreadIds] = useState<string[]>([]);
  const [isDeletingThread, startDeletingThread] = useTransition();
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [lastTimestamps, setLastTimestamps] = useState<Record<string, string>>(
    initialLastTimestamps
  );
  const { unreadCounts, reload: reloadUnreadCounts, clearSender } =
    useChatUnreadCountsBySender(coachUserId);
  const active = students.find((s) => s.id === activeId);
  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
  const visibleStudents = normalizedSearch
    ? students.filter((student) =>
        student.name.toLocaleLowerCase("tr-TR").includes(normalizedSearch)
      )
    : students;

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

  const handleDeleteThread = (student: StudentCardDto) => {
    if (!student.userId || isDeletingThread) return;
    const confirmed = window.confirm(
      `${student.name} ile olan geçmiş sohbet silinsin mi?`
    );
    if (!confirmed) return;

    setOpenMenuId(null);
    startDeletingThread(async () => {
      await deleteThreadMessagesAction(student.userId!);
      setLastMessages((prev) => {
        const next = { ...prev };
        delete next[student.userId!];
        return next;
      });
      setLastTimestamps((prev) => {
        const next = { ...prev };
        delete next[student.userId!];
        return next;
      });
      setDeletedThreadIds((prev) => [...prev, student.userId!]);
      clearSender(student.userId!);
      if (activeId === student.id) {
        setChatResetKey((key) => key + 1);
      }
      window.setTimeout(() => void reloadUnreadCounts(), 300);
    });
  };

  return (
    <div className="coach-chat-shell">
      <aside className="coach-chat-list" aria-label="Öğrenci sohbetleri">
        <div className="coach-chat-list-head">
          <svg
            className="coach-chat-search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Öğrenci ara..."
            aria-label="Öğrenci ara"
          />
        </div>
        <div className="coach-chat-list-body">
          {visibleStudents.map((s) => {
            const last = s.userId ? lastMessages[s.userId] : undefined;
            const ts = s.userId ? lastTimestamps[s.userId] : undefined;
            const unreadCount = s.userId ? unreadCounts[s.userId] ?? 0 : 0;
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                className={`coach-chat-item ${
                  activeId === s.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveId(s.id);
                  setOpenMenuId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveId(s.id);
                    setOpenMenuId(null);
                  }
                }}
              >
                <span className="coach-chat-avatar-wrap" aria-hidden="true">
                  <UserAvatar name={s.name} size={38} />
                </span>
                <span className="coach-chat-item-body">
                  <span className="coach-chat-item-top">
                    <span className="coach-chat-item-name">{s.name}</span>
                    <span className="coach-chat-item-actions">
                      {ts && (
                        <span
                          className="coach-chat-item-time"
                          title={new Date(ts).toLocaleString("tr-TR")}
                        >
                          {formatChatTimestamp(ts)}
                        </span>
                      )}
                      <span className="coach-chat-menu-wrap">
                        <button
                          type="button"
                          className="coach-chat-item-menu-btn"
                          title="Sohbet seçenekleri"
                          aria-label={`${s.name} sohbet seçenekleri`}
                          aria-expanded={openMenuId === s.id}
                          disabled={!s.userId || isDeletingThread}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId((id) => (id === s.id ? null : s.id));
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="15"
                            height="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 12h.01M19 12h.01M5 12h.01" />
                          </svg>
                        </button>
                        {openMenuId === s.id && (
                          <span
                            className="coach-chat-item-menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleDeleteThread(s)}
                            >
                              Geçmiş sohbeti sil
                            </button>
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                  <span className="coach-chat-item-bottom">
                    <span className="coach-chat-item-preview">
                      {last ?? ""}
                    </span>
                    {unreadCount > 0 && (
                      <span className="coach-chat-unread">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </div>
            );
          })}
          {visibleStudents.length === 0 && (
            <div className="coach-chat-empty-list">
              Aramanızla eşleşen öğrenci bulunamadı.
            </div>
          )}
        </div>
      </aside>

      <section className="coach-chat-conversation">
        {active?.userId ? (
          <ChatPanel
            key={`${active.userId}-${chatResetKey}`}
            currentUserId={coachUserId}
            otherUserId={active.userId}
            otherUserName={active.name}
            otherUserMeta={active.track ?? active.grade ?? undefined}
            profileHref={`/coach/students/${active.id}`}
            visualVariant="coach"
            onLastMessage={handleLastMessage}
            onThreadRead={(userId) => {
              clearSender(userId);
              window.setTimeout(() => void reloadUnreadCounts(), 800);
            }}
            initialMessages={
              active.id === selectedStudentId &&
              !deletedThreadIds.includes(active.userId)
                ? initialMessages
                : undefined
            }
          />
        ) : (
          <div className="coach-chat-no-thread">
            <strong>Konuşma seçin</strong>
            <span>Mesajları görüntülemek için sol listeden bir öğrenci seçin.</span>
          </div>
        )}
      </section>
    </div>
  );
}
