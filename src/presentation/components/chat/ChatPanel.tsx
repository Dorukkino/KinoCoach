"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { MessageDto } from "@/application/dto";
import { listMessagesAction, sendMessageAction } from "@/app/actions/messages";
import { formatChatTimestamp } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function ChatPanel({
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

  useEffect(() => {
    onLastMessageRef.current = onLastMessage;
  }, [onLastMessage]);

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
    channelName: `chat-${otherUserId}`,
    table: "messages",
    pollIntervalMs: 3000,
    onChange: load,
  });

  const send = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      await sendMessageAction(otherUserId, text.trim());
      setText("");
      load();
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
      <div className="chat-thread flex-1">
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
