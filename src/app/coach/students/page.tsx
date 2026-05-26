import {
  listActiveStudentsAction,
  listArchivedStudentsAction,
} from "@/app/actions/students";
import { StudentsPageClient } from "./StudentsPageClient";

export default async function CoachStudentsPage() {
  const [active, archived] = await Promise.all([
    listActiveStudentsAction(),
    listArchivedStudentsAction(),
  ]);
  return (
    <StudentsPageClient initialActive={active} initialArchived={archived} />
  );
}
