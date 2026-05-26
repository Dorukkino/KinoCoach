import { redirect } from "next/navigation";
import { createServerContainer } from "@/infrastructure/di/container";
import { AppShell } from "@/presentation/components/layout/AppShell";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const container = await createServerContainer();
  const session = await container.auth.getSession();
  if (!session || !session.role.isCoach()) redirect("/login");

  const profile = await container.users.findById(session.userId);

  return (
    <AppShell role="coach" userName={profile?.fullName ?? "Koç"} pageTitle="">
      {children}
    </AppShell>
  );
}
