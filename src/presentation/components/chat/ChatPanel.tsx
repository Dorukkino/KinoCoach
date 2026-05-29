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

const MAX_MESSAGES_IN_MEMORY = 200;
const VIRTUAL_WINDOW = 120;

function capMessages(list: MessageDto[]): MessageDto[] {
  if (list.length <= MAX_MESSAGES_IN_MEMORY) return list;
  return list.slice(list.length - MAX_MESSAGES_IN_MEMORY);
}

export function ChatPanel({
  currentUserId,
  otherUserId,
  otherUserName,
  profileHref,
  onLastMessage,
  onThreadRead,
  initialMessages,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  profileHref?: string;
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
  const [isLoading, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const textRef = useRef("");
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
    if (!content) return;

    const optimisticId = `pending-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const optimistic: MessageDto = {
      id: optimisticId,
      senderId: currentUserId,
      receiverId: otherUserId,
      content,
      createdAt: new Date().toISOString(),
      attachmentUrl: null,
      isMine: true,
    };

    textRef.current = "";
    setText("");
    setSendError(null);
    setMessages((prev) => capMessages([...prev, optimistic]));
    onLastMessageRef.current?.(otherUserId, content, optimistic.createdAt);

    setIsSending(true);
    void sendMessageAction(otherUserId, content)
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
        setSendError("Mesaj gönderilemedi. Tekrar deneyin.");
        load();
      })
      .finally(() => setIsSending(false));
  };

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
