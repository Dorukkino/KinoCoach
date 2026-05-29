import "server-only";
import { cache } from "react";
import {
  createAdminContainer,
  getCachedServerContainer,
} from "@/infrastructure/di/container";

export const getContainer = getCachedServerContainer;

export const requireSession = cache(async () => {
  const container = await getContainer();
  const session = await container.auth.getSession();
  if (!session) throw new Error("Unauthorized");
  return { container, session };
});

export async function requireCoach() {
  const { container, session } = await requireSession();
  if (!session.role.isCoach()) throw new Error("Forbidden");
  return { container, session };
}

export async function requireAdmin() {
  const { session } = await requireSession();
  if (!session.role.isAdmin()) throw new Error("Forbidden");
  return { container: createAdminContainer(), session };
}
