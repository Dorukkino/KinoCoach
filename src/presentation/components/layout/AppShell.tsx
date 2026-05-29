"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sidebar } from "./Sidebar";
import { signOutAction } from "@/app/actions/auth";
import { NotificationBell } from "@/presentation/components/notifications/NotificationBell";
import { CoachClientCacheProvider } from "@/presentation/providers/CoachClientCacheProvider";
import { RealtimeEventBusProvider } from "@/presentation/providers/RealtimeEventBusProvider";

export function AppShell({
  role,
  userId,
  userName,
  pageTitle,
  children,
}: {
  role: "coach" | "student";
  userId: string;
  userName: string;
  pageTitle: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const currentPage = pathname.split("/").filter(Boolean).at(-1) ?? "dashboard";
  const isCoachChatPage = role === "coach" && pathname === "/coach/chat";
  const derivedTitle =
    currentPage === "dashboard"
      ? "Genel Bakış"
      : currentPage === "students"
        ? "Öğrencilerim"
      : currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  const title = pageTitle || derivedTitle;

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
      router.replace("/login");
      router.refresh();
    });
  };

  const shell = (
    <div className="app" data-collapsed={collapsed}>
      <Sidebar
        role={role}
        userId={userId}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        userName={userName}
        onSignOut={handleSignOut}
        signOutPending={pending}
      />
      <div className="main">
        <header className={`topbar${role === "coach" ? " topbar-coach" : ""}`}>
          {role === "coach" ? (
            <div className="topbar-breadcrumb">
              <span>Koç Paneli</span>
              <span>/</span>
              <strong>{title}</strong>
            </div>
          ) : (
            <h2 className="text-sm font-semibold m-0">{pageTitle}</h2>
          )}
          <div className="topbar-actions">
            <NotificationBell userId={userId} />
            {role === "coach" && !isCoachChatPage && (
              <button
                type="button"
                className="btn btn-primary text-xs"
                onClick={() => router.push("/coach/weekly")}
              >
                + Yeni Görev
              </button>
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );

  const withRealtime = (
    <RealtimeEventBusProvider userId={userId}>{shell}</RealtimeEventBusProvider>
  );

  if (role === "coach") {
    return (
      <CoachClientCacheProvider>{withRealtime}</CoachClientCacheProvider>
    );
  }

  return withRealtime;
}
