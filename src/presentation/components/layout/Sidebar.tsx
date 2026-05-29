"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Icons, NavIconKey } from "../icons";
import { useChatUnreadCount } from "@/presentation/hooks/useChatUnreadCounts";
import { useOptionalCoachClientCache } from "@/presentation/providers/CoachClientCacheProvider";

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
      { id: "dashboard", label: "Genel Bakış", href: "/coach/dashboard", icon: "Dashboard" },
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
      { id: "dashboard", label: "Genel Bakış", href: "/student/dashboard", icon: "Dashboard" },
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

const STUDENT_PREFETCH_HREFS = ["/student/dashboard"];

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
  disablePrefetch,
  onRoutePrefetch,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  chatUnreadCount: number;
  disablePrefetch: boolean;
  onRoutePrefetch: (href: string) => void;
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
        if (!disablePrefetch) onRoutePrefetch(item.href);
      }}
      onFocus={() => {
        if (!disablePrefetch) onRoutePrefetch(item.href);
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

export function Sidebar({
  role,
  userId,
  collapsed,
  onToggle,
  userName,
  onSignOut,
  signOutPending,
}: {
  role: "coach" | "student";
  userId: string;
  collapsed: boolean;
  onToggle: () => void;
  userName: string;
  onSignOut: () => void;
  signOutPending: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "coach" ? COACH_NAV : STUDENT_NAV;
  const { unreadCount: chatUnreadCount } = useChatUnreadCount(userId);
  const { prefetchStudents } = useOptionalCoachClientCache();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const isChatRoute = role === "coach" && pathname.startsWith("/coach/chat");
  const isStudentChatRoute = role === "student" && pathname.startsWith("/student/chat");

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

  const prefetchStudentRoute = useCallback(
    (href: string) => {
      if (role !== "student") return;
      if (isStudentChatRoute) return;
      if (prefetchedRoutesRef.current.has(href)) return;
      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);
    },
    [role, isStudentChatRoute, router]
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

  useEffect(() => {
    if (role !== "student") return;

    const prefetchInitialRoutes = () => {
      if (isStudentChatRoute) return;
      for (const href of STUDENT_PREFETCH_HREFS) {
        if (href === pathname) continue;
        prefetchStudentRoute(href);
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetchInitialRoutes);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetchInitialRoutes, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [role, pathname, isStudentChatRoute, prefetchStudentRoute]);

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
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? "›" : "‹"}
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
                  disablePrefetch={isStudentChatRoute}
                  onRoutePrefetch={prefetchStudentRoute}
                />
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-user-wrap">
        {!collapsed ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">{userName.trim().slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{userName}</span>
              <span className="sidebar-user-role">{role === "coach" ? "Koç hesabı" : "Öğrenci hesabı"}</span>
            </div>
            <button
              type="button"
              className="sidebar-signout"
              disabled={signOutPending}
              onClick={onSignOut}
              aria-label="Çıkış yap"
            >
              Çıkış
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="sidebar-user-collapsed"
            title={`${userName} - çıkış yap`}
            disabled={signOutPending}
            onClick={onSignOut}
          >
            {userName.trim().slice(0, 1).toUpperCase()}
          </button>
        )}
      </div>
    </aside>
  );
}
