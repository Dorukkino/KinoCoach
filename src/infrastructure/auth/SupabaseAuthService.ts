import { SupabaseClient } from "@supabase/supabase-js";
import {
  AuthSession,
  IAuthService,
} from "@/application/ports/IAuthService";
import { UserRole } from "@/domain/value-objects/UserRole";
import { mapAuthError } from "./authErrors";

export class SupabaseAuthService implements IAuthService {
  private cachedSession: AuthSession | null | undefined = undefined;

  constructor(private readonly supabase: SupabaseClient) {}

  async getSession(): Promise<AuthSession | null> {
    // Request içinde tekrar çağrılırsa cache'den dön
    if (this.cachedSession !== undefined) return this.cachedSession;

    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      this.cachedSession = null;
      return null;
    }

    const { data: profile } = await this.supabase
      .from("users")
      .select("role, full_name, account_status")
      .eq("id", user.id)
      .single();

    if (profile?.account_status === "disabled") {
      await this.supabase.auth.signOut();
      throw new Error("Bu hesap devre dışı bırakılmış.");
    }

    // Metadata hızlı fallback olarak kullanılır; kalıcı yetki DB profilindedir.
    const metaRole = user.user_metadata?.role;
    const metaFullName = user.user_metadata?.full_name;

    const role = profile?.role
      ? UserRole.from(String(profile.role))
      : metaRole
        ? UserRole.from(String(metaRole))
        : UserRole.coach();
    const fullName = String(
      profile?.full_name ?? metaFullName ?? user.email?.split("@")[0] ?? ""
    );

    this.cachedSession = {
      userId: user.id,
      email: user.email ?? "",
      role,
      fullName,
    };
    return this.cachedSession;
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(mapAuthError(error.message));
    const session = await this.getSession();
    if (!session) throw new Error("Oturum oluşturulamadı");
    return session;
  }

  async signUpCoach(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthSession> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "coach", full_name: fullName },
      },
    });

    if (error) throw new Error(mapAuthError(error.message));

    if (!data.user) {
      throw new Error(
        "Hesap oluşturulamadı. SUPABASE_SERVICE_ROLE_KEY tanımlı değilse Admin API kullanılamaz; .env.local dosyanızı kontrol edin."
      );
    }

    if (data.session) {
      const session = await this.getSession();
      if (session) return session;
    }

    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
      const session = await this.getSession();
      if (session) return session;
    }

    if (signInError) {
      throw new Error(
        mapAuthError(signInError.message) +
          " E-posta doğrulaması açıksa gelen kutunuzu kontrol edip ardından giriş yapın."
      );
    }

    return {
      userId: data.user.id,
      email,
      role: UserRole.coach(),
      fullName,
    };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
