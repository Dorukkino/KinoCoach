import { createServerContainer } from "@/infrastructure/di/container";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoachLessonNetsPage() {
  const c = await createServerContainer();
  const session = await c.auth.getSession();
  if (!session) redirect("/login");
  const students = await c.listActiveStudents.execute(session.userId);

  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Soru Çözüm Listesi</h1>
          <p>Öğrencilerin ders net girişlerini inceleyin</p>
        </div>
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {students.map((s) => (
          <li key={s.id}>
            <Link href={`/coach/students/${s.id}?tab=lesson-nets`} className="panel p-4 block">
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
