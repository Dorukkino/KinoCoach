import "server-only";
import { unstable_cache } from "next/cache";
import { createServerContainer } from "@/infrastructure/di/container";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import type { ArchivedStudentRowDto } from "@/application/use-cases/ListArchivedStudentsForCoachUseCase";

export const coachCacheTags = {
  students: (coachId: string) => `coach-students-${coachId}`,
  archived: (coachId: string) => `coach-archived-${coachId}`,
} as const;

const CACHE_REVALIDATE_SECONDS = 300;

export function getCachedActiveStudents(
  coachId: string
): Promise<CoachStudentRowDto[]> {
  return unstable_cache(
    async () => {
      const container = await createServerContainer();
      return container.listActiveStudents.execute(coachId);
    },
    ["coach-active-students", coachId],
    {
      tags: [coachCacheTags.students(coachId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    }
  )();
}

export function getCachedArchivedStudents(
  coachId: string
): Promise<ArchivedStudentRowDto[]> {
  return unstable_cache(
    async () => {
      const container = await createServerContainer();
      return container.listArchivedStudents.execute(coachId);
    },
    ["coach-archived-students", coachId],
    {
      tags: [coachCacheTags.archived(coachId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    }
  )();
}
