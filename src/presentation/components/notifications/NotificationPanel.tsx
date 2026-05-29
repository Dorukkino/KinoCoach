"use client";

import { NotificationDto } from "@/application/dto";
import { Icons } from "@/presentation/components/icons";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";

interface NotificationPanelProps {
  items: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
}

function getNotificationInitial(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("message") || normalized.includes("chat")) return "M";
  if (normalized.includes("task") || normalized.includes("weekly")) return "G";
  if (normalized.includes("exam")) return "D";
  return "B";
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAssociatedStudentName(notification: NotificationDto) {
  const metadataName = notification.metadata?.studentName?.trim();
  if (metadataName) return metadataName;

  const message = notification.message.trim();
  if (!notification.metadata?.studentId || message.startsWith("Koçunuz")) return null;

  const delimiters = [
    " ders ",
    " koçluk ",
    " tarihinde ",
    " bir ",
    ' "',
  ];
  const delimiterIndex = delimiters
    .map((delimiter) => message.indexOf(delimiter))
    .filter((index) => index > 0)
    .sort((a, b) => a - b)[0];

  if (!delimiterIndex) return null;
  const candidate = message.slice(0, delimiterIndex).trim();
  return candidate.includes(" ") ? candidate : null;
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
      <div className="notification-panel notification-panel-loading">
        <div className="notification-loading-icon" />
        <span>Bildirimler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="notification-panel">
      <div className="notification-panel-head">
        <div>
          <span className="notification-panel-eyebrow">Güncel Akış</span>
          <h3>
            Bildirimler
            {unreadCount > 0 && (
              <span>{unreadCount}</span>
            )}
          </h3>
        </div>
        <div className="notification-panel-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-action-btn primary"
              onClick={() => void markAllRead()}
            >
              Okundu yap
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              className="notification-action-btn"
              onClick={() => void deleteAll()}
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="notification-empty">
          <div className="notification-empty-icon">
            <Icons.Bell width={18} height={18} />
          </div>
          <strong>Henüz bildirim yok</strong>
          <p>Yeni gelişmeler olduğunda burada sade bir akış olarak görünecek.</p>
        </div>
      ) : (
        <ul className="notification-list">
          {items.map((n) => {
            const studentName = getAssociatedStudentName(n);

            return (
              <li
                key={n.id}
                className={`notification-item${n.isRead ? " is-read" : " is-unread"}`}
              >
                {studentName ? (
                  <UserAvatar name={studentName} size={34} />
                ) : (
                  <div className="notification-item-icon">
                    {getNotificationInitial(n.type)}
                  </div>
                )}
                <div className="notification-item-body">
                  <div className="notification-item-title-row">
                    <h4>{n.title}</h4>
                    {!n.isRead && <span className="notification-unread-dot" />}
                  </div>
                  <p>{n.message}</p>
                  <div className="notification-item-meta">
                    <span>{formatNotificationDate(n.createdAt)}</span>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => void markRead(n.id)}
                      >
                        Okundu
                      </button>
                    )}
                  </div>
                </div>
                <div className="notification-item-tools">
                  <button
                    type="button"
                    className="notification-delete-btn"
                    aria-label="Bildirimi sil"
                    onClick={() => void deleteOne(n.id)}
                  >
                    <Icons.Close width={14} height={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
