"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { MessageDto } from "@/application/dto";
import { listMessagesAction, sendMessageAction } from "@/app/actions/messages";
import { formatChatTimestamp } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function ChatPanel({
  currentUserId,
  otherUserId,
  otherUserName,
  profileHref,
  onLastMessage,
  initialMessages,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  profileHref?: string;
  onLastMessage?: (userId: string, text: string, createdAt: string) => void;
  initialMessages?: MessageDto[];
}) {
  const skipInitialLoad = useRef(initialMessages !== undefined);
  const [messages, setMessages] = useState<MessageDto[]>(initialMessages ?? []);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const onLastMessageRef = useRef(onLastMessage);
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
    hasScrolledInitially.current = false;
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
    });
  }, [otherUserId, startTransition]);

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      const last = initialMessages?.[initialMessages.length - 1];
      if (last) {
        onLastMessageRef.current?.(otherUserId, last.content, last.createdAt);
      }
      return;
    }
    load();
  }, [initialMessages, load, otherUserId]);

  useSupabaseTableRealtime({
    channelName: `chat-${currentUserId}-${otherUserId}`,
    table: "messages",
    filter: `receiver_id=eq.${currentUserId}`,
    debounceMs: 250,
    onChange: load,
  });

  const send = () => {
    const content = text.trim();
    if (!content || pending) return;

    const optimisticId = `pending-${Date.now()}`;
    const optimistic: MessageDto = {
      id: optimisticId,
      senderId: currentUserId,
      receiverId: otherUserId,
      content,
      createdAt: new Date().toISOString(),
      attachmentUrl: null,
      isMine: true,
    };

    setText("");
    setMessages((prev) => [...prev, optimistic]);
    onLastMessageRef.current?.(otherUserId, content, optimistic.createdAt);

    startTransition(async () => {
      try {
        const saved = await sendMessageAction(otherUserId, content);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? saved : m))
        );
        onLastMessageRef.current?.(otherUserId, saved.content, saved.createdAt);
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setText(content);
      }
    });
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
      <div className="p-4 border-t border-[var(--border)] flex gap-2">
        <input
          className="input mb-0 flex-1"
          placeholder="Mesaj yaz…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={send}
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
