import "server-only";
import { createServerContainer } from "@/infrastructure/di/container";

export async function getContainer() {
  return createServerContainer();
}

export async function requireSession() {
  const container = await getContainer();
  const session = await container.auth.getSession();
  if (!session) throw new Error("Unauthorized");
  return { container, session };
}

export async function requireCoach() {
  const { container, session } = await requireSession();
  if (!session.role.isCoach()) throw new Error("Forbidden");
  return { container, session };
}
