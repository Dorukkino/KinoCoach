"use client";

import { NotificationDto } from "@/application/dto";
import { Icons } from "@/presentation/components/icons";

interface NotificationPanelProps {
  items: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
}

export function NotificationPanel({
  items,
  unreadCount,
  loading,
  markRead,
  markAllRead,
  deleteOne,
  deleteAll,
}: NotificationPanelProps) {
  if (loading) {
    return (
      <div className="panel p-4 text-sm text-[var(--muted)]" style={{ minWidth: 320 }}>
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
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-[var(--accent-ink)] hover:underline"
              onClick={() => void markAllRead()}
            >
              Tümünü okundu işaretle
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              className="text-xs text-[var(--muted)] hover:text-[var(--risk)] hover:underline"
              onClick={() => void deleteAll()}
            >
              Tümünü sil
            </button>
          )}
        </div>
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
              className={`group px-4 py-3 text-sm ${
                n.isRead ? "opacity-70" : "bg-[var(--bg-elev)]"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
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
                </div>
                <button
                  type="button"
                  className="notification-delete-btn shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Bildirimi sil"
                  onClick={() => void deleteOne(n.id)}
                >
                  <Icons.Close width={14} height={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
