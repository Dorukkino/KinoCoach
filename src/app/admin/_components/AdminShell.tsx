"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "İlişkiler", href: "/admin/engagements" },
  { label: "Davetler", href: "/admin/invitations" },
];

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <div className="app" data-collapsed={collapsed}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="brand-mark">k</div>
          {!collapsed && (
            <div>
              <span className="brand-name">KinoCoach Admin</span>
              <span className="brand-sub">SaaS yönetimi</span>
            </div>
          )}
        </div>
        <nav className="nav">
          <div className="nav-section-title">Yönetim</div>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${pathname.startsWith(item.href) ? " active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span aria-hidden="true">•</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--border)]">
          <button
            type="button"
            className="btn btn-outline w-full justify-center text-xs mb-2"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? "Aç" : "Daralt"}
          </button>
          {!collapsed && (
            <p className="m-0 text-xs text-[var(--muted)] truncate">{userName}</p>
          )}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h2 className="text-sm font-semibold m-0">Admin Panel</h2>
          <div className="topbar-actions">
            <button
              type="button"
              className="btn btn-outline text-xs"
              disabled={pending}
              onClick={handleSignOut}
            >
              Çıkış
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
