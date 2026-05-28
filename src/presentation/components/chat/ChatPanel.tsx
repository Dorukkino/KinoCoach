"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { MessageDto } from "@/application/dto";
import {
  listMessagesAction,
  markThreadMessagesReadAction,
  sendMessageAction,
} from "@/app/actions/messages";
import { formatChatTimestamp } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

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
  const [messages, setMessages] = useState<MessageDto[]>(initialMessages ?? []);
  const [text, setText] = useState("");
  const [isLoading, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const textRef = useRef("");
  const onLastMessageRef = useRef(onLastMessage);
  const onThreadReadRef = useRef(onThreadRead);
  const threadRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);

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
  }, [otherUserId]);

  const markCurrentThreadRead = useCallback(async () => {
    await markThreadMessagesReadAction(otherUserId);
    onThreadReadRef.current?.(otherUserId);
  }, [otherUserId]);

  useEffect(() => {
    if (!lastMessageId) return;
    scrollToBottom(hasScrolledInitially.current ? "smooth" : "instant");
    hasScrolledInitially.current = true;
  }, [messages.length, lastMessageId, scrollToBottom]);

  const load = useCallback(() => {
    startTransition(async () => {
      const list = await listMessagesAction(otherUserId);
      setMessages(list);
      const last = list[list.length - 1];
      if (last) onLastMessageRef.current?.(otherUserId, last.content, last.createdAt);
      await markCurrentThreadRead();
    });
  }, [markCurrentThreadRead, otherUserId, startTransition]);

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

      const incoming: MessageDto = {
        id: String(row.id),
        senderId,
        receiverId,
        content: String(row.content ?? ""),
        createdAt: String(row.created_at),
        attachmentUrl: row.attachment_url ? String(row.attachment_url) : null,
        isMine: false,
      };

      setMessages((prev) => {
        if (prev.some((message) => message.id === incoming.id)) return prev;
        return [...prev, incoming];
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
    setMessages((prev) => [...prev, optimistic]);
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
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setText((prev) => {
          if (prev.trim()) return prev;
          textRef.current = content;
          return content;
        });
        setSendError("Mesaj gönderilemedi. Tekrar deneyin.");
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
      <div ref={threadRef} className="chat-thread flex-1">
        {messages.map((m) => (
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
