type AuthErrorLike = {
  message?: string;
  status?: number;
  name?: string;
};

/** Supabase Auth hatasını kullanıcıya gösterilecek Türkçe metne çevirir. */
export function formatAuthError(error: AuthErrorLike | string): string {
  if (typeof error === "string") return mapAuthErrorMessage(error);

  const { message = "", status, name } = error;
  const lower = message.toLowerCase();

  if (
    status === 504 ||
    name === "AuthRetryableFetchError" ||
    lower === "{}" ||
    message === "{}"
  ) {
    return "Supabase, SMTP sunucusuna bağlanırken zaman aşımına uğradı (504). Dashboard → Authentication → Emails → SMTP Settings bölümünde Host, Port (587 veya 465), kullanıcı adı/şifre ve gönderen (from) adresini kontrol edin. Resend kullanıyorsanız host: smtp.resend.com, port: 587.";
  }

  return mapAuthErrorMessage(message, { status, name });
}

/** Maps Supabase Auth errors to user-facing Turkish messages. */
export function mapAuthError(
  message: string,
  context?: Pick<AuthErrorLike, "status" | "name">
): string {
  return mapAuthErrorMessage(message, context);
}

function mapAuthErrorMessage(
  message: string,
  context?: Pick<AuthErrorLike, "status" | "name">
): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid") && lower.includes("email")) {
    return "Bu e-posta adresi kabul edilmiyor. Gerçek bir adres deneyin (ör. Gmail). test@test.com gibi adresler Supabase tarafından engellenebilir.";
  }
  if (lower.includes("rate limit") || lower.includes("only request this after")) {
    return "Çok fazla deneme yapıldı. Bir dakika bekleyip tekrar deneyin.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.";
  }
  if (
    lower.includes("students_coach_id_fkey") ||
    lower.includes("coaching_engagements_coach_id_fkey") ||
    lower.includes("foreign key")
  ) {
    return "Koç profili veritabanında bulunamadı. Supabase'de 004_backfill_users_from_auth.sql çalıştırın veya çıkış yapıp tekrar giriş yapın.";
  }
  if (lower.includes("students cannot self-register")) {
    return "Öğrenci profili oluşturulamadı. Supabase'de 003_fix_student_user_trigger.sql çalıştırıldığından emin olun.";
  }
  if (lower.includes("database error creating new user")) {
    return "Kullanıcı oluşturulamadı. Supabase SQL Editor'de 003_fix_student_user_trigger.sql dosyasını çalıştırın (trigger düzeltmesi).";
  }
  if (lower.includes("password") && lower.includes("least")) {
    return "Şifre en az 6 karakter olmalıdır.";
  }
  if (
    lower.includes("email not confirmed") ||
    lower.includes("confirm your email")
  ) {
    return "E-postanızı doğrulamanız gerekiyor. Gelen kutunuzu kontrol edin, ardından giriş yapın.";
  }
  if (
    lower.includes("error sending invite email") ||
    lower.includes("error sending recovery") ||
    lower.includes("error sending confirmation") ||
    lower.includes("error sending magic link") ||
    lower.includes("sending email") ||
    lower.includes("smtp")
  ) {
    return "Davet e-postası gönderilemedi. Supabase Auth Logs'unu kontrol edin (Dashboard → Logs → Auth). Genelde Custom SMTP ayarlarındaki gönderen (from) adresi doğrulanmamıştır, ya da Redirect URLs listesinde callback URL'i eksiktir.";
  }
  if (
    lower.includes("redirect") &&
    (lower.includes("not allowed") || lower.includes("invalid"))
  ) {
    return "Yönlendirme URL'si Supabase tarafından kabul edilmedi. Dashboard → Authentication → URL Configuration → Redirect URLs listesine /auth/callback adresini ekleyin.";
  }

  if (context?.status === 504 || context?.name === "AuthRetryableFetchError") {
    return "Supabase, SMTP sunucusuna bağlanırken zaman aşımına uğradı. SMTP host/port ve kimlik bilgilerini kontrol edin.";
  }

  if (!message || message === "{}" || lower === "{}") {
    return "Supabase Auth isteği başarısız oldu. Dashboard → Logs → Auth bölümünden ayrıntıya bakın.";
  }

  return message;
}
