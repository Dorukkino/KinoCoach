"use client";

import { useCoachClientCache } from "@/presentation/providers/CoachClientCacheProvider";
import { StudentsListSkeleton } from "@/presentation/components/skeletons";
import { StudentsPageClient } from "./StudentsPageClient";

export function StudentsCachedFallback() {
  const { students } = useCoachClientCache();

  if (students) {
    return (
      <StudentsPageClient
        initialActive={students.active}
        initialArchived={students.archived}
      />
    );
  }

  return <StudentsListSkeleton />;
}
