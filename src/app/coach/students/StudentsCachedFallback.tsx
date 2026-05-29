"use client";

import { useCoachClientCache } from "@/presentation/providers/CoachClientCacheProvider";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";
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

  return <LoadingScreen />;
}
