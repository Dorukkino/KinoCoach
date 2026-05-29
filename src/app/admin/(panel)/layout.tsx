import { cache } from "react";
import { redirect } from "next/navigation";
import { getCachedServerContainer } from "@/infrastructure/di/container";
import { AdminShell } from "../_components/AdminShell";

const getAdminLayoutData = cache(async () => {
  const container = await getCachedServerContainer();
  const session = await container.auth.getSession();
  if (!session) redirect("/admin/login");
  if (!session.role.isAdmin()) {
    redirect(session.role.isStudent() ? "/student/dashboard" : "/coach/dashboard");
  }

  const profile = await container.users.findById(session.userId);
  return { userName: profile?.fullName ?? session.fullName ?? "Admin" };
});

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName } = await getAdminLayoutData();
  return <AdminShell userName={userName}>{children}</AdminShell>;
}
