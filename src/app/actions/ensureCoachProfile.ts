import "server-only";
import type { ServerContainer } from "@/infrastructure/di/container";
import type { AuthSession } from "@/application/ports/IAuthService";
import { UserRole } from "@/domain/value-objects/UserRole";

/** Coach must exist in public.users before coaching_engagements.coach_id FK insert. */
export async function ensureCoachProfile(
  container: ServerContainer,
  session: AuthSession
) {
  const existing = await container.users.findById(session.userId);
  if (existing) return existing;

  return container.users.create({
    id: session.userId,
    email: session.email,
    role: UserRole.coach(),
    fullName: session.email.split("@")[0] || "Koç",
  });
}
