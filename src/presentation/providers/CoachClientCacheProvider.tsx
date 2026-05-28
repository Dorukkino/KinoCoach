"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import type { ArchivedStudentRowDto } from "@/application/use-cases/ListArchivedStudentsForCoachUseCase";

export interface CoachStudentsCache {
  active: CoachStudentRowDto[];
  archived: ArchivedStudentRowDto[];
}

interface CoachClientCacheContextValue {
  students: CoachStudentsCache | null;
  setStudents: (data: CoachStudentsCache) => void;
  patchActiveStudents: (
    updater: (active: CoachStudentRowDto[]) => CoachStudentRowDto[]
  ) => void;
  prefetchStudents: () => Promise<void>;
}

const CoachClientCacheContext =
  createContext<CoachClientCacheContextValue | null>(null);

export function CoachClientCacheProvider({ children }: { children: ReactNode }) {
  const [students, setStudentsState] = useState<CoachStudentsCache | null>(
    null
  );
  const prefetchPromiseRef = useRef<Promise<void> | null>(null);

  const setStudents = useCallback((data: CoachStudentsCache) => {
    setStudentsState(data);
  }, []);

  const patchActiveStudents = useCallback(
    (updater: (active: CoachStudentRowDto[]) => CoachStudentRowDto[]) => {
      setStudentsState((prev) => {
        if (!prev) return prev;
        return { ...prev, active: updater(prev.active) };
      });
    },
    []
  );

  const prefetchStudents = useCallback(async () => {
    if (prefetchPromiseRef.current) {
      return prefetchPromiseRef.current;
    }

    prefetchPromiseRef.current = (async () => {
      const { listActiveStudentsAction, listArchivedStudentsAction } =
        await import("@/app/actions/students");
      const [active, archived] = await Promise.all([
        listActiveStudentsAction(),
        listArchivedStudentsAction(),
      ]);
      setStudentsState({ active, archived });
    })().finally(() => {
      prefetchPromiseRef.current = null;
    });

    return prefetchPromiseRef.current;
  }, []);

  const value = useMemo(
    () => ({
      students,
      setStudents,
      patchActiveStudents,
      prefetchStudents,
    }),
    [students, setStudents, patchActiveStudents, prefetchStudents]
  );

  return (
    <CoachClientCacheContext.Provider value={value}>
      {children}
    </CoachClientCacheContext.Provider>
  );
}

export function useCoachClientCache() {
  const ctx = useContext(CoachClientCacheContext);
  if (!ctx) {
    throw new Error(
      "useCoachClientCache must be used within CoachClientCacheProvider"
    );
  }
  return ctx;
}

export function useOptionalCoachClientCache() {
  const ctx = useContext(CoachClientCacheContext);
  return useMemo<CoachClientCacheContextValue>(
    () =>
      ctx ?? {
        students: null,
        setStudents: () => {},
        patchActiveStudents: () => {},
        prefetchStudents: async () => {},
      },
    [ctx]
  );
}
