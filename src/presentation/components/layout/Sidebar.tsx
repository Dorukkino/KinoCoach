"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons, NavIconKey } from "../icons";

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

export function Sidebar({
  role,
  collapsed,
  onToggle,
  userName,
}: {
  role: "coach" | "student";
  collapsed: boolean;
  onToggle: () => void;
  userName: string;
}) {
  const pathname = usePathname();
  const nav = role === "coach" ? COACH_NAV : STUDENT_NAV;

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
              const Icon = Icons[item.icon];
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`nav-item${active ? " active" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
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
