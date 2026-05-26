import { IAdminAuthService, IAuthService } from "../ports/IAuthService";
import { IUserRepository } from "../ports/IUserRepository";
import { UserRole } from "@/domain/value-objects/UserRole";
import { Email } from "@/domain/value-objects/Email";

export class RegisterCoachUseCase {
  constructor(
    private readonly auth: IAuthService,
    private readonly users: IUserRepository,
    private readonly adminAuth?: IAdminAuthService | null
  ) {}

  async execute(input: {
    email: string;
    password: string;
    fullName: string;
  }) {
    const email = Email.create(input.email);

    let session;

    if (this.adminAuth) {
      try {
        await this.adminAuth.createCoachUser(
          email.value,
          input.password,
          input.fullName
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message.toLowerCase() : "";
        const alreadyRegistered =
          msg.includes("already registered") ||
          msg.includes("zaten kayıtlı");
        if (!alreadyRegistered) throw err;
      }
      session = await this.auth.signIn(email.value, input.password);
    } else {
      session = await this.auth.signUpCoach(
        email.value,
        input.password,
        input.fullName
      );
      await this.ensureUserProfile(session.userId, email.value, input.fullName);
    }

    return session;
  }

  private async ensureUserProfile(
    userId: string,
    email: string,
    fullName: string
  ) {
    const existing = await this.users.findById(userId);
    if (!existing) {
      await this.users.create({
        id: userId,
        email,
        role: UserRole.coach(),
        fullName,
      });
    }
  }
}
