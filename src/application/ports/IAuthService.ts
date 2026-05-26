import { UserRole } from "@/domain/value-objects/UserRole";

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface CreateStudentAuthResult {
  userId: string;
  email: string;
  actionLink: string;
}

export interface IAuthService {
  getSession(): Promise<AuthSession | null>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signUpCoach(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthSession>;
  signOut(): Promise<void>;
}

export interface CreateCoachAuthResult {
  userId: string;
  email: string;
}

export interface IAdminAuthService {
  /**
   * Yeni öğrenci hesabı için Supabase'in güvenli invite linkini üretir.
   * Mail gönderimi uygulamanın kendi e-posta servisiyle yapılır.
   */
  createStudentUser(
    email: string,
    fullName: string,
    redirectTo: string
  ): Promise<CreateStudentAuthResult>;
  createPasswordRecoveryLink(
    email: string,
    redirectTo: string
  ): Promise<string>;
  createCoachUser(
    email: string,
    password: string,
    fullName: string
  ): Promise<CreateCoachAuthResult>;
}
