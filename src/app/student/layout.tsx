import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCachedServerContainer } from "@/infrastructure/di/container";
import { AppShell } from "@/presentation/components/layout/AppShell";
import { cache } from "react";

const TOUCH_DEBOUNCE_MS = 5 * 60 * 1000; // 5 dakika

const getStudentLayoutData = cache(async () => {
  const container = await getCachedServerContainer();
  const session = await container.auth.getSession();
  if (!session) redirect("/login");
  if (session.role.isAdmin()) redirect("/admin/dashboard");
  if (!session.role.isStudent()) redirect("/coach/dashboard");

  const student = await container.students.findByUserId(session.userId);

  if (student) {
    const lastActive = student.lastActiveAt
      ? new Date(student.lastActiveAt).getTime()
      : 0;
    if (Date.now() - lastActive > TOUCH_DEBOUNCE_MS) {
      after(async () => {
        await container.students.touchLastActive(student.id);
      });
    }
  }

  return { userId: session.userId, userName: student?.name ?? "Öğrenci" };
});

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, userName } = await getStudentLayoutData();

  return (
    <AppShell role="student" userId={userId} userName={userName} pageTitle="">
      {children}
    </AppShell>
  );
}
