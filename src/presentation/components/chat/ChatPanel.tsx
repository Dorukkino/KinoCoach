"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { MessageDto } from "@/application/dto";
import { listMessagesAction, sendMessageAction } from "@/app/actions/messages";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";
import { formatChatTimestamp } from "@/lib/dates";

export function ChatPanel({
  otherUserId,
  otherUserName,
  profileHref,
  onLastMessage,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  profileHref?: string;
  onLastMessage?: (userId: string, text: string, createdAt: string) => void;
}) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const list = await listMessagesAction(otherUserId);
      setMessages(list);
      const last = list[list.length - 1];
      if (last) onLastMessage?.(otherUserId, last.content, last.createdAt);
    });
  };

  useEffect(() => {
    load();
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUserId]);

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
