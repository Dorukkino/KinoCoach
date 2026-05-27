import { createServerContainer } from "@/infrastructure/di/container";
import { redirect } from "next/navigation";
import { CoachChatClient } from "./CoachChatClient";
import { getLastMessageTimestampsAction } from "@/app/actions/messages";

export async function CoachChatContent({
  selectedStudentId,
}: {
  selectedStudentId?: string;
}) {
  const c = await createServerContainer();
  const session = await c.auth.getSession();
  if (!session) redirect("/login");

  const allStudents = await c.listActiveStudents.execute(session.userId);
  const students = allStudents.filter((s) => s.userId);

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

  const selected = selectedStudentId
    ? sortedStudents.find((s) => s.id === selectedStudentId) ?? sortedStudents[0]
    : sortedStudents[0];

  return (
    <CoachChatClient
      coachUserId={session.userId}
      students={sortedStudents}
      selectedStudentId={selected?.id}
      initialLastTimestamps={lastTimestamps}
    />
  );
}
