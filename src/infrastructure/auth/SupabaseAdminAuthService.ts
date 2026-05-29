import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateStudentAuthResult,
  IAdminAuthService,
} from "@/application/ports/IAuthService";
import { mapAuthError } from "./authErrors";
import { CreateCoachAuthResult } from "@/application/ports/IAuthService";

export class SupabaseAdminAuthService implements IAdminAuthService {
  constructor(private readonly admin: SupabaseClient) {}

  async createStudentUser(
    email: string,
    fullName: string,
    redirectTo: string
  ): Promise<CreateStudentAuthResult> {
    // Supabase sadece güvenli invite linkini üretir; SMTP gönderimini
    // uygulamanın kendi mail servisi yapar.
    const { data, error } = await this.admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { role: "student", full_name: fullName },
        redirectTo,
      },
    });

    if (error) {
      console.error("[invite] Supabase generateLink error", {
        message: error.message,
        status: error.status,
        code: (error as { code?: string }).code,
        name: error.name,
      });
      throw new Error(mapAuthError(error.message));
    }
    if (!data.user) throw new Error("Öğrenci hesabı oluşturulamadı");
    const actionLink = data.properties?.action_link;
    if (!actionLink) throw new Error("Davet bağlantısı oluşturulamadı");

    const { error: profileError } = await this.admin.from("users").upsert({
      id: data.user.id,
      email,
      role: "student",
      full_name: fullName,
    });

    if (profileError) throw new Error(mapAuthError(profileError.message));

    return {
      userId: data.user.id,
      email,
      actionLink,
    };
  }

  async createPasswordRecoveryLink(
    email: string,
    redirectTo: string
  ): Promise<string> {
    const { data, error } = await this.admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error) throw new Error(mapAuthError(error.message));
    const actionLink = data.properties?.action_link;
    if (!actionLink) throw new Error("Şifre sıfırlama bağlantısı oluşturulamadı");
    return actionLink;
  }

  async createCoachUser(
    email: string,
    password: string,
    fullName: string
  ): Promise<CreateCoachAuthResult> {
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "coach", full_name: fullName },
    });

    if (error) throw new Error(mapAuthError(error.message));
    if (!data.user) throw new Error("Koç hesabı oluşturulamadı");

    const { error: profileError } = await this.admin.from("users").upsert({
      id: data.user.id,
      email,
      role: "coach",
      full_name: fullName,
    });

    if (profileError) throw new Error(mapAuthError(profileError.message));

    return { userId: data.user.id, email };
  }

  async updateUserMetadata(
    userId: string,
    metadata: { role?: string; fullName?: string }
  ): Promise<void> {
    const userMetadata: Record<string, string> = {};
    if (metadata.role) userMetadata.role = metadata.role;
    if (metadata.fullName) userMetadata.full_name = metadata.fullName;

    const { error } = await this.admin.auth.admin.updateUserById(userId, {
      user_metadata: userMetadata,
    });
    if (error) throw new Error(mapAuthError(error.message));
  }
}
