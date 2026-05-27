import { createServerContainer } from "@/infrastructure/di/container";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";

export default async function CoachExamsPage() {
  const c = await createServerContainer();
  const session = await c.auth.getSession();
  if (!session) redirect("/login");
  const students = await c.listActiveStudents.execute(session.userId);

  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix="coach-exams"
        tables={["exam_results", "students", "coaching_engagements"]}
      />
      <div className="page-head">
        <div className="page-title">
          <h1>Deneme Netleri</h1>
          <p>Öğrenci detayından deneme ekleyin ve grafikleri görün</p>
        </div>
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {students.map((s) => (
          <li key={s.id}>
            <Link
              href={`/coach/students/${s.id}`}
              className="panel p-4 block"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
