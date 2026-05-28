"use client";

import { useRouter } from "next/navigation";
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
      />
      <div className="main">
        <header className="topbar">
          <h2 className="text-sm font-semibold m-0">{pageTitle}</h2>
          <div className="topbar-actions">
            <NotificationBell userId={userId} />
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
