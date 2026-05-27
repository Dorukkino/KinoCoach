"use client";

import { useNotifications } from "@/presentation/hooks/useNotifications";

interface NotificationPanelProps {
  userId: string;
}

export function NotificationPanel({ userId }: NotificationPanelProps) {
  const { items, unreadCount, loading, markRead, markAllRead } =
    useNotifications(userId);

  if (loading) {
    return (
      <div className="panel p-4 text-sm text-[var(--muted)]">
        Bildirimler yükleniyor…
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden" style={{ minWidth: 320, maxWidth: 400 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="font-semibold text-sm">
          Bildirimler
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            className="text-xs text-[var(--accent-ink)] hover:underline"
            onClick={() => void markAllRead()}
          >
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-sm text-[var(--muted)]">
          Henüz bildirim yok.
        </div>
      ) : (
        <ul className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border)]">
          {items.map((n) => (
            <li
              key={n.id}
              className={`px-4 py-3 text-sm ${
                n.isRead ? "opacity-70" : "bg-[var(--bg-elev)]"
              }`}
            >
              <div className="font-medium">{n.title}</div>
              <p className="text-[var(--muted)] mt-1 leading-snug">{n.message}</p>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="text-xs text-[var(--muted-2)]">
                  {new Date(n.createdAt).toLocaleString("tr-TR")}
                </span>
                {!n.isRead && (
                  <button
                    type="button"
                    className="text-xs text-[var(--accent-ink)] hover:underline shrink-0"
                    onClick={() => void markRead(n.id)}
                  >
                    Okundu
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
