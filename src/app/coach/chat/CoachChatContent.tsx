import { redirect } from "next/navigation";
import { CoachChatClient } from "./CoachChatClient";
import { getLastMessageTimestampsAction, listMessagesAction } from "@/app/actions/messages";
import { listActiveStudentsAction } from "@/app/actions/students";
import { requireSession } from "@/app/actions/lib";

export async function CoachChatContent({
  selectedStudentId,
}: {
  selectedStudentId?: string;
}) {
  const { session } = await requireSession();
  if (!session.role.isCoach()) redirect("/login");

  const allStudents = await listActiveStudentsAction();
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

  const thread = selected?.userId != null
      ? await listMessagesAction(selected.userId)
      : undefined;
  const initialMessages = thread?.messages;

  return (
    <CoachChatClient
      coachUserId={session.userId}
      students={sortedStudents}
      selectedStudentId={selected?.id}
      initialLastTimestamps={lastTimestamps}
      initialMessages={initialMessages}
    />
  );
}
