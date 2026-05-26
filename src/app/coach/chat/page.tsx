import { createServerContainer } from "@/infrastructure/di/container";
import { redirect } from "next/navigation";
import { CoachChatClient } from "./CoachChatClient";
import { getLastMessageTimestampsAction } from "@/app/actions/messages";

export default async function CoachChatPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const c = await createServerContainer();
  const session = await c.auth.getSession();
  if (!session) redirect("/login");

  const allStudents = await c.listActiveStudents.execute(session.userId);
  const students = allStudents.filter((s) => s.userId);

  // Her öğrenciyle son mesajlaşma zamanını çek ve listeyi en yeni → en eski sırala.
  // Hiç mesajlaşılmamış öğrenciler en sonda kalır (öğrenci kayıt sırasına göre).
  const lastTimestamps = await getLastMessageTimestampsAction(
    students.map((s) => s.userId!).filter(Boolean)
  );
  const sortedStudents = [...students].sort((a, b) => {
    const ta = a.userId ? lastTimestamps[a.userId] : undefined;
    const tb = b.userId ? lastTimestamps[b.userId] : undefined;
    if (ta && tb) return tb.localeCompare(ta);
    if (ta) return -1;
    if (tb) return 1;
    return 0;
  });

  const { student: studentId } = await searchParams;
  const selected = studentId
    ? sortedStudents.find((s) => s.id === studentId) ?? sortedStudents[0]
    : sortedStudents[0];

  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Chat</h1>
          <p>Öğrencilerinizle mesajlaşın</p>
        </div>
      </div>
      <CoachChatClient
        coachUserId={session.userId}
        students={sortedStudents}
        selectedStudentId={selected?.id}
        initialLastTimestamps={lastTimestamps}
      />
    </div>
  );
}
