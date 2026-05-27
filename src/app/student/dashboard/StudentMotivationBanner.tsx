"use client";

import { useCallback, useEffect, useState } from "react";
import { getStudentMotivationAction } from "@/app/actions/dashboard";
import type { MotivationCardDto } from "@/application/dto";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function StudentMotivationBanner({
  studentId,
  initialMotivation,
}: {
  studentId: string;
  initialMotivation: MotivationCardDto | null;
}) {
  const [motivation, setMotivation] = useState<MotivationCardDto | null>(
    initialMotivation
  );

  const load = useCallback(async () => {
    setMotivation(await getStudentMotivationAction());
  }, []);

  useEffect(() => {
    setMotivation(initialMotivation);
  }, [initialMotivation]);

  useSupabaseTableRealtime({
    channelName: `student-motivation-${studentId}`,
    table: "motivation_messages",
    filter: `student_id=eq.${studentId}`,
    debounceMs: 250,
    onChange: load,
  });

  if (!motivation) return null;

  return (
    <div className="panel p-6 mb-4 border-l-4 border-[var(--accent)]">
      <p className="text-xs font-semibold text-[var(--muted)] m-0 mb-1">
        {motivation.coachName} diyor ki
      </p>
      <p className="text-base m-0">{motivation.message}</p>
    </div>
  );
}
