import {
  listActiveStudentsAction,
  listArchivedStudentsAction,
} from "@/app/actions/students";
import { StudentsPageClient } from "./StudentsPageClient";

export async function StudentsPageContent() {
  const [active, archived] = await Promise.all([
    listActiveStudentsAction(),
    listArchivedStudentsAction(),
  ]);
  return (
    <StudentsPageClient initialActive={active} initialArchived={archived} />
  );
}
