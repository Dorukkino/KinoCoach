"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Icons, NavIconKey } from "../icons";
import { useChatUnreadCount } from "@/presentation/hooks/useChatUnreadCounts";
import { useCoachClientCache } from "@/presentation/providers/CoachClientCacheProvider";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
}

const COACH_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Genel",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/coach/dashboard", icon: "Dashboard" },
      { id: "students", label: "Öğrencilerim", href: "/coach/students", icon: "Students" },
      { id: "notes", label: "Notlar", href: "/coach/notes", icon: "Notes" },
    ],
  },
  {
    section: "İletişim",
    items: [{ id: "chat", label: "Chat", href: "/coach/chat", icon: "Chat" }],
  },
];

const STUDENT_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Genel",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/student/dashboard", icon: "Dashboard" },
      { id: "weekly", label: "Programım", href: "/student/weekly", icon: "Calendar" },
      { id: "exams", label: "Deneme Netlerim", href: "/student/exams", icon: "Trial" },
      { id: "lesson-nets", label: "Soru Çözüm", href: "/student/lesson-nets", icon: "Lessons" },
    ],
  },
  {
    section: "İletişim",
    items: [{ id: "chat", label: "Chat", href: "/student/chat", icon: "Chat" }],
  },
];

const COACH_PREFETCH_HREFS = [
  "/coach/dashboard",
  "/coach/students",
  "/coach/notes",
  "/coach/chat",
];

function CoachNavLink({
  item,
  active,
  collapsed,
  chatUnreadCount,
  disablePrefetch,
  onRoutePrefetch,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  chatUnreadCount: number;
  disablePrefetch: boolean;
  onRoutePrefetch: (href: string, intent: "idle" | "user") => void;
}) {
  const Icon = Icons[item.icon];

  return (
    <Link
      key={item.id}
      href={item.href}
      prefetch={disablePrefetch ? false : undefined}
      className={`nav-item${active ? " active" : ""}`}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => {
        if (!disablePrefetch) onRoutePrefetch(item.href, "user");
      }}
      onFocus={() => {
        if (!disablePrefetch) onRoutePrefetch(item.href, "user");
      }}
    >
      <Icon />
      {!collapsed && <span>{item.label}</span>}
      {item.id === "chat" && chatUnreadCount > 0 && (
        <span className="nav-badge" aria-label={`${chatUnreadCount} okunmamış mesaj`}>
          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
        </span>
      )}
    </Link>
  );
}

function StudentNavLink({
  item,
  active,
  collapsed,
  chatUnreadCount,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  chatUnreadCount: number;
}) {
  const Icon = Icons[item.icon];

  return (
    <Link
      key={item.id}
      href={item.href}
      className={`nav-item${active ? " active" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <Icon />
      {!collapsed && <span>{item.label}</span>}
      {item.id === "chat" && chatUnreadCount > 0 && (
        <span className="nav-badge" aria-label={`${chatUnreadCount} okunmamış mesaj`}>
          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  role,
  userId,
  collapsed,
  onToggle,
  userName,
}: {
  role: "coach" | "student";
  userId: string;
  collapsed: boolean;
  onToggle: () => void;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "coach" ? COACH_NAV : STUDENT_NAV;
  const { unreadCount: chatUnreadCount } = useChatUnreadCount(userId);
  const { prefetchStudents } = useCoachClientCache();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const isChatRoute = role === "coach" && pathname.startsWith("/coach/chat");

  const prefetchCoachRoute = useCallback(
    (href: string, intent: "idle" | "user" = "user") => {
      if (role !== "coach") return;
      if (isChatRoute) return;
      if (prefetchedRoutesRef.current.has(href)) return;
      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);

      if (href === "/coach/students" && intent === "user") {
        void prefetchStudents();
      }
    },
    [role, isChatRoute, router, prefetchStudents]
  );

  useEffect(() => {
    if (role !== "coach") return;
    if (isChatRoute) return;

    const prefetchInitialRoutes = () => {
      for (const href of COACH_PREFETCH_HREFS) {
        if (href === pathname) continue;
        prefetchCoachRoute(href, "idle");
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetchInitialRoutes);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetchInitialRoutes, 1500);
    return () => window.clearTimeout(timeoutId);
  }, [role, pathname, isChatRoute, prefetchCoachRoute]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="brand-mark">k</div>
        {!collapsed && (
          <div>
            <span className="brand-name">Kino</span>
            <span className="brand-sub">{role === "coach" ? "Coach" : "Student"}</span>
          </div>
        )}
        <button
          type="button"
          className="ml-auto text-muted text-xs"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          «
        </button>
      </div>
      <nav className="nav">
        {nav.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <div className="nav-section-title">{group.section}</div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              if (role === "coach") {
                return (
                  <CoachNavLink
                    key={item.id}
                    item={item}
                    active={active}
                    collapsed={collapsed}
                    chatUnreadCount={chatUnreadCount}
                    disablePrefetch={isChatRoute}
                    onRoutePrefetch={prefetchCoachRoute}
                  />
                );
              }
              return (
                <StudentNavLink
                  key={item.id}
                  item={item}
                  active={active}
                  collapsed={collapsed}
                  chatUnreadCount={chatUnreadCount}
                />
              );
            })}
          </div>
        ))}
      </nav>
      {!collapsed && (
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-sm font-medium truncate">
            {userName}
          </div>
        </div>
      )}
    </aside>
  );
}
