import { createServerContainer } from "@/infrastructure/di/container";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { redirect } from "next/navigation";
import { StudentChatClient } from "./StudentChatClient";
import { getLastMessageTimestampsAction, listMessagesAction } from "@/app/actions/messages";

async function fetchCoachName(coachId: string): Promise<string> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", coachId)
      .maybeSingle();
    if (data?.full_name && data.full_name.trim()) return data.full_name.trim();
    if (data?.email) return data.email.split("@")[0];
  } catch {
    // ignore
  }
  return "Koçunuz";
}

export async function StudentChatContent() {
  const c = await createServerContainer();
  const session = await c.auth.getSession();
  if (!session) redirect("/login");

  const student = await c.students.findByUserId(session.userId);
  if (!student) redirect("/login");

  const activeEngagement = await c.engagements.findActiveByStudent(student.id);
  if (!activeEngagement) {
    return (
      <div className="panel p-6">
        <p>
          Şu anda aktif bir koçunuz yok. Bir koç sizi davet ettiğinde burada
          mesajlaşabilirsiniz.
        </p>
      </div>
    );
  }

  const coachUserId = activeEngagement.coachId;
  const [coachName, lastTimestamps, initialMessages] = await Promise.all([
    fetchCoachName(coachUserId),
    getLastMessageTimestampsAction([coachUserId]),
    listMessagesAction(coachUserId),
  ]);

  return (
    <>
      <p className="text-sm text-[var(--muted)] m-0 mb-4">
        Koçunuz: <strong>{coachName}</strong>
      </p>
      <StudentChatClient
        studentUserId={session.userId}
        coachUserId={coachUserId}
        coachName={coachName}
        initialLastTimestamp={lastTimestamps[coachUserId]}
        initialMessages={initialMessages}
      />
    </>
  );
}
