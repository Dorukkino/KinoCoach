import { redirect } from "next/navigation";
import { getCachedServerContainer } from "@/infrastructure/di/container";
import { AppShell } from "@/presentation/components/layout/AppShell";
import { cache } from "react";

const getCoachLayoutData = cache(async () => {
  const container = await getCachedServerContainer();
  const session = await container.auth.getSession();
  if (!session) redirect("/login");
  if (!session.role.isCoach()) redirect("/student/dashboard");

  const profile = await container.users.findById(session.userId);
  return { userId: session.userId, userName: profile?.fullName ?? "Koç" };
});

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, userName } = await getCoachLayoutData();

  return (
    <AppShell role="coach" userId={userId} userName={userName} pageTitle="">
      {children}
    </AppShell>
  );
}
