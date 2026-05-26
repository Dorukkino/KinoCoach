import { redirect } from "next/navigation";
import { createServerContainer } from "@/infrastructure/di/container";
import { AppShell } from "@/presentation/components/layout/AppShell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const container = await createServerContainer();
  const session = await container.auth.getSession();
  if (!session || !session.role.isStudent()) redirect("/login");

  const student = await container.students.findByUserId(session.userId);
  if (student) {
    await container.students.touchLastActive(student.id);
  }

  return (
    <AppShell
      role="student"
      userName={student?.name ?? "Öğrenci"}
      pageTitle=""
    >
      {children}
    </AppShell>
  );
}
