import { listActiveStudentsAction } from "@/app/actions/students";
import Link from "next/link";

export async function CoachLessonNetsContent() {
  const students = await listActiveStudentsAction();

  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-2">
      {students.map((s) => (
        <li key={s.id}>
          <Link
            href={`/coach/students/${s.id}?tab=lesson-nets`}
            className="panel p-4 block"
          >
            {s.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
