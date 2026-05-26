"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sidebar } from "./Sidebar";
import { signOutAction } from "@/app/actions/auth";

export function AppShell({
  role,
  userName,
  pageTitle,
  children,
}: {
  role: "coach" | "student";
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

  return (
    <div className="app" data-collapsed={collapsed}>
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        userName={userName}
      />
      <div className="main">
        <header className="topbar">
          <h2 className="text-sm font-semibold m-0">{pageTitle}</h2>
          <div className="ml-auto">
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
