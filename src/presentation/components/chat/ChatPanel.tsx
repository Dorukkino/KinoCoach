"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { MessageDto } from "@/application/dto";
import type { MessageThreadCursor } from "@/application/ports/IMessageRepository";
import {
  listMessagesAction,
  markThreadMessagesReadAction,
  sendMessageAction,
} from "@/app/actions/messages";
import { formatChatTimestamp } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";

const MAX_MESSAGES_IN_MEMORY = 200;
const VIRTUAL_WINDOW = 120;

function CoachChatAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  return <UserAvatar name={name} size={size === "sm" ? 28 : 38} />;
}

function capMessages(list: MessageDto[]): MessageDto[] {
  if (list.length <= MAX_MESSAGES_IN_MEMORY) return list;
  return list.slice(list.length - MAX_MESSAGES_IN_MEMORY);
}

export function ChatPanel({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserMeta,
  profileHref,
  visualVariant = "default",
  onLastMessage,
  onThreadRead,
  initialMessages,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserMeta?: string | null;
  profileHref?: string;
  visualVariant?: "default" | "coach";
  onLastMessage?: (userId: string, text: string, createdAt: string) => void;
  onThreadRead?: (userId: string) => void;
  initialMessages?: MessageDto[];
}) {
  const skipInitialLoad = useRef(initialMessages !== undefined);
  const [messages, setMessages] = useState<MessageDto[]>(
    capMessages(initialMessages ?? [])
  );
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<MessageThreadCursor | null>(
    null
  );
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const textRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onLastMessageRef = useRef(onLastMessage);
  const onThreadReadRef = useRef(onThreadRead);
  const threadRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);
  const markReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleMessages =
    messages.length > VIRTUAL_WINDOW
      ? messages.slice(messages.length - VIRTUAL_WINDOW)
      : messages;
  const hiddenCount = messages.length - visibleMessages.length;
  const isCoachVariant = visualVariant === "coach";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    onLastMessageRef.current = onLastMessage;
  }, [onLastMessage]);

  useEffect(() => {
    onThreadReadRef.current = onThreadRead;
  }, [onThreadRead]);

  useEffect(() => {
    hasScrolledInitially.current = false;
    setMessages(capMessages(initialMessages ?? []));
    setHasMore(false);
    setNextCursor(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [otherUserId, initialMessages]);

  const markCurrentThreadRead = useCallback(() => {
    if (markReadTimeoutRef.current) {
      clearTimeout(markReadTimeoutRef.current);
    }

    markReadTimeoutRef.current = setTimeout(() => {
      markReadTimeoutRef.current = null;
      onThreadReadRef.current?.(otherUserId);
      void markThreadMessagesReadAction(otherUserId)
        .then(() => {
          onThreadReadRef.current?.(otherUserId);
        })
        .catch(() => {});
    }, 600);
  }, [otherUserId]);

  useEffect(() => {
    return () => {
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!lastMessageId) return;
    scrollToBottom(hasScrolledInitially.current ? "smooth" : "instant");
    hasScrolledInitially.current = true;
  }, [messages.length, lastMessageId, scrollToBottom]);

  const mergeThread = useCallback(
    (list: MessageDto[], pendingMessages: MessageDto[]) => {
      const merged = capMessages([...list, ...pendingMessages]);
      return merged;
    },
    []
  );

  const load = useCallback(
    (before?: MessageThreadCursor) => {
      startTransition(async () => {
        const result = await listMessagesAction(otherUserId, before);
        setMessages((prev) => {
          const pendingMessages = prev.filter(
            (message) =>
              message.id.startsWith("pending-") &&
              message.senderId === currentUserId &&
              message.receiverId === otherUserId &&
              !result.messages.some((saved) => {
                const sentCloseTogether =
                  Math.abs(
                    new Date(saved.createdAt).getTime() -
                      new Date(message.createdAt).getTime()
                  ) < 30000;
                return (
                  saved.senderId === message.senderId &&
                  saved.receiverId === message.receiverId &&
                  saved.content === message.content &&
                  sentCloseTogether
                );
              })
          );
          if (before) {
            return capMessages([...result.messages, ...prev]);
          }
          return mergeThread(result.messages, pendingMessages);
        });
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
        const last = result.messages[result.messages.length - 1];
        if (last && !before) {
          onLastMessageRef.current?.(otherUserId, last.content, last.createdAt);
        }
        if (!before) markCurrentThreadRead();
      });
    },
    [currentUserId, markCurrentThreadRead, mergeThread, otherUserId, startTransition]
  );

  const loadOlder = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    const el = threadRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const result = await listMessagesAction(otherUserId, nextCursor);
      setMessages((prev) =>
        capMessages([...result.messages, ...prev])
      );
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      requestAnimationFrame(() => {
        if (el) {
          el.scrollTop = el.scrollHeight - prevHeight;
        }
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, nextCursor, otherUserId]);

  const handleThreadScroll = useCallback(() => {
    const el = threadRef.current;
    if (!el || loadingOlder) return;
    if (el.scrollTop < 48 && hasMore) {
      void loadOlder();
    }
  }, [hasMore, loadOlder, loadingOlder]);

  const handleRealtimeMessage = useCallback(
    (payload?: { eventType?: string; new?: Record<string, unknown> }) => {
      const row = payload?.new;
      if (!row || payload?.eventType !== "INSERT") {
        load();
        return;
      }

      const senderId = String(row.sender_id ?? "");
      const receiverId = String(row.receiver_id ?? "");
      if (senderId !== otherUserId || receiverId !== currentUserId) return;

      const incomingCreatedAt = String(row.created_at);
      const incoming: MessageDto = {
        id: String(row.id),
        senderId,
        receiverId,
        content: String(row.content ?? ""),
        createdAt: incomingCreatedAt,
        attachmentUrl: row.attachment_url ? String(row.attachment_url) : null,
        isMine: false,
      };

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          new Date(incomingCreatedAt).getTime() <
            new Date(last.createdAt).getTime()
        ) {
          return prev;
        }
        if (prev.some((message) => message.id === incoming.id)) return prev;
        return capMessages([...prev, incoming]);
      });
      onLastMessageRef.current?.(
        otherUserId,
        incoming.content,
        incoming.createdAt
      );
      void markCurrentThreadRead();
    },
    [currentUserId, load, markCurrentThreadRead, otherUserId]
  );

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      const last = initialMessages?.[initialMessages.length - 1];
      if (last) {
        onLastMessageRef.current?.(otherUserId, last.content, last.createdAt);
      }
      void markCurrentThreadRead();
      return;
    }
    load();
  }, [initialMessages, load, markCurrentThreadRead, otherUserId]);

  useSupabaseTableRealtime({
    channelName: `chat-${currentUserId}-${otherUserId}`,
    table: "messages",
    filter: `receiver_id=eq.${currentUserId}`,
    debounceMs: 0,
    onChange: handleRealtimeMessage,
  });

  const send = () => {
    const content = textRef.current.trim();
    const file = selectedFile;
    if (!content && !file) return;

    const optimisticId = `pending-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const optimisticAttachmentUrl = file ? URL.createObjectURL(file) : null;
    const optimistic: MessageDto = {
      id: optimisticId,
      senderId: currentUserId,
      receiverId: otherUserId,
      content: content || file?.name || "",
      createdAt: new Date().toISOString(),
      attachmentUrl: optimisticAttachmentUrl,
      isMine: true,
    };

    textRef.current = "";
    setText("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSendError(null);
    setMessages((prev) => capMessages([...prev, optimistic]));
    onLastMessageRef.current?.(
      otherUserId,
      content || file?.name || "Dosya gönderildi",
      optimistic.createdAt
    );

    setIsSending(true);
    const formData = new FormData();
    if (file) {
      formData.append("attachment", file);
    }

    void sendMessageAction(otherUserId, content, file ? formData : undefined)
      .then((saved) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? saved : m))
        );
        onLastMessageRef.current?.(otherUserId, saved.content, saved.createdAt);
      })
      .catch(() => {
        setText((prev) => {
          if (prev.trim()) return prev;
          textRef.current = content;
          return content;
        });
        setSelectedFile(file);
        setSendError("Mesaj gönderilemedi. Tekrar deneyin.");
        load();
      })
      .finally(() => {
        if (optimisticAttachmentUrl) URL.revokeObjectURL(optimisticAttachmentUrl);
        setIsSending(false);
      });
  };

  if (!isCoachVariant) {
    return (
      <div className="panel flex flex-col h-[520px]">
        <header className="p-4 border-b border-[var(--border)] font-semibold">
          {profileHref ? (
            <Link
              href={profileHref}
              className="hover:underline text-[var(--accent-ink)]"
              title="Öğrenci profilini aç"
            >
              {otherUserName}
            </Link>
          ) : (
            otherUserName
          )}
        </header>
        <div
          ref={threadRef}
          className="chat-thread flex-1"
          onScroll={handleThreadScroll}
        >
          {loadingOlder && (
            <p className="text-xs text-center text-[var(--muted)] py-2 m-0">
              Eski mesajlar yükleniyor…
            </p>
          )}
          {hiddenCount > 0 && (
            <p className="text-xs text-center text-[var(--muted)] py-2 m-0">
              {hiddenCount} eski mesaj bellekte tutuluyor
            </p>
          )}
          {visibleMessages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${m.isMine ? "mine" : "theirs"}`}
            >
              {m.content}
              {m.attachmentUrl && (
                <a
                  href={m.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs mt-1 underline"
                >
                  Dosya
                </a>
              )}
              <div
                className="chat-bubble-time"
                title={new Date(m.createdAt).toLocaleString("tr-TR")}
              >
                {formatChatTimestamp(m.createdAt)}
              </div>
            </div>
          ))}
        </div>
        <form
          className="p-4 border-t border-[var(--border)] flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="flex-1">
            <input
              className="input mb-0 w-full"
              placeholder="Mesaj yaz…"
              value={text}
              onChange={(e) => {
                textRef.current = e.target.value;
                setText(e.target.value);
              }}
              aria-invalid={sendError ? "true" : undefined}
            />
            {sendError && (
              <p className="text-xs text-red-600 mt-1 mb-0">{sendError}</p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!text.trim()}
            aria-busy={isLoading || isSending}
          >
            Gönder
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="coach-chat-thread-card">
      <header className="coach-chat-thread-head">
        <CoachChatAvatar name={otherUserName} />
        <div className="coach-chat-thread-title">
          {profileHref ? (
            <Link href={profileHref} title="Öğrenci profilini aç">
              {otherUserName}
            </Link>
          ) : (
            <span>{otherUserName}</span>
          )}
          <div>
            <span className="coach-chat-presence on inline" />
            Çevrimiçi{otherUserMeta ? ` · ${otherUserMeta}` : ""}
          </div>
        </div>
      </header>

      <div className="coach-chat-day-sep">
        <span>Bugün</span>
      </div>

      <div
        ref={threadRef}
        className="coach-chat-messages"
        onScroll={handleThreadScroll}
      >
        {loadingOlder && (
          <p className="coach-chat-thread-note">Eski mesajlar yükleniyor...</p>
        )}
        {hiddenCount > 0 && (
          <p className="coach-chat-thread-note">
            {hiddenCount} eski mesaj bellekte tutuluyor
          </p>
        )}
        {visibleMessages.map((m) => (
          <div
            key={m.id}
            className={`coach-chat-msg ${m.isMine ? "me" : "them"}`}
          >
            {!m.isMine && <CoachChatAvatar name={otherUserName} size="sm" />}
            <div className={`coach-chat-bubble ${m.isMine ? "me" : "them"}`}>
              {m.content && <span>{m.content}</span>}
              {m.attachmentUrl && (
                <a
                  href={m.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="coach-chat-file"
                >
                  <span className="coach-chat-file-ico">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 3h9l4 4v14H6z" />
                      <path d="M14 3v4h5" />
                    </svg>
                  </span>
                  <span>
                    <strong>Dosya</strong>
                    <small>Ek dosyayı aç</small>
                  </span>
                  <em>İndir</em>
                </a>
              )}
              <span
                className="coach-chat-time"
                title={new Date(m.createdAt).toLocaleString("tr-TR")}
              >
                {formatChatTimestamp(m.createdAt)}
              </span>
            </div>
          </div>
        ))}
        {visibleMessages.length === 0 && (
          <div className="coach-chat-empty-thread">İlk mesajını gönder</div>
        )}
      </div>

      <form
        className="coach-chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="coach-chat-file-input"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setSelectedFile(file);
            setSendError(null);
          }}
        />
        <button
          type="button"
          className="coach-chat-icon-btn"
          title="Dosya ekle"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10 19" />
          </svg>
        </button>
        <div className="coach-chat-input-wrap">
          {selectedFile && (
            <div className="coach-chat-selected-file">
              <span>{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Dosyayı kaldır"
              >
                Kaldır
              </button>
            </div>
          )}
          <input
            placeholder="Mesaj yaz..."
            value={text}
            onChange={(e) => {
              textRef.current = e.target.value;
              setText(e.target.value);
            }}
            aria-invalid={sendError ? "true" : undefined}
          />
          {sendError && <p>{sendError}</p>}
        </div>
        <button
          type="submit"
          className="coach-chat-send"
          disabled={!text.trim() && !selectedFile}
          aria-label="Gönder"
          aria-busy={isLoading || isSending}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 14-7-5 16-3-6z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
