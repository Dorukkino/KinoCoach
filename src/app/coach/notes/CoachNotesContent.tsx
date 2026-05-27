import { getCoachNotesPageDataAction } from "@/app/actions/notes";
import { CoachNotesClient } from "./CoachNotesClient";

export async function CoachNotesContent() {
  const { students, notes } = await getCoachNotesPageDataAction();
  return <CoachNotesClient students={students} notes={notes} />;
}
