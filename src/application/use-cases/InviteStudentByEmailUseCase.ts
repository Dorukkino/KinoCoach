import { randomBytes } from "node:crypto";
import { IAdminAuthService } from "../ports/IAuthService";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IUserRepository } from "../ports/IUserRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IInvitationRepository } from "../ports/IInvitationRepository";
import { IEmailService } from "../ports/IEmailService";
import { Email } from "@/domain/value-objects/Email";
import {
  EmailBelongsToCoachError,
  StudentAlreadyEngagedError,
} from "@/domain/errors/EngagementErrors";

export interface InviteStudentResult {
  /** Yeni oluşturulan veya mevcut öğrencinin id'si. */
  studentId: string;
  /** Aktif engagement varsa id'si (otomatik kabul akışında). */
  engagementId: string | null;
  /** Bekleyen davet (mevcut hesap için). */
  invitationId: string | null;
  invitationToken: string | null;
  /** UI'nin ayırt edebilmesi için ne yapıldığını belirtir. */
  outcome:
    | "created_with_engagement"
    | "invited_existing_student"
    | "already_engaged";
}

/**
 * Koç bir e-posta ile öğrenci eklemek istediğinde:
 *  - E-posta sistemde yoksa: yeni öğrenci hesabı yarat + ilk engagement'ı aç.
 *  - E-posta zaten öğrenciye aitse: aktif engagement yoksa davet gönder,
 *    aktif engagement varsa hata fırlat.
 *  - E-posta koça aitse: hata.
 */
export class InviteStudentByEmailUseCase {
  constructor(
    private readonly adminAuth: IAdminAuthService,
    private readonly students: IStudentRepository,
    private readonly users: IUserRepository,
    private readonly engagements: IEngagementRepository,
    private readonly invitations: IInvitationRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(input: {
    coachId: string;
    name: string;
    email: string;
    grade?: string;
    track?: string;
    schoolLevel?: string;
    /**
     * Davet maili tıklandığında kullanıcının düşeceği URL. Genelde uygulamanın
     * /auth/callback rotasıdır; `?next=/auth/update-password` ile şifre
     * belirleme sayfasına yönlendirilir.
     */
    inviteRedirectTo: string;
  }): Promise<InviteStudentResult> {
    const email = Email.create(input.email);
    const [existingUser, coach] = await Promise.all([
      this.users.findByEmail(email.value),
      this.users.findById(input.coachId),
    ]);
    const coachName = coach?.fullName || "Koçun";
    const siteUrl = getOrigin(input.inviteRedirectTo);

    if (existingUser && existingUser.role.isCoach()) {
      throw new EmailBelongsToCoachError();
    }

    if (existingUser) {
      // `public.users` satırı `handle_new_user` trigger'ı tarafından doldurulur,
      // ama `public.students` satırını eskiden uygulama katmanı eklerdi. Eski
      // kayıtlarda (ör. trigger eklenmeden önce açılan hesaplar, manuel temizlik
      // sonrası kalan hayalet auth user'lar) `students` profili eksik olabilir.
      // Bu durumda davet akışını kırmak yerine profili sessizce tamamlıyoruz.
      let studentProfile = await this.students.findByUserId(existingUser.id);
      if (!studentProfile) {
        studentProfile = await this.students.create({
          userId: existingUser.id,
          name: input.name,
          email: existingUser.email,
          grade: input.grade,
          track: input.track,
        });
      }
      const active = await this.engagements.findActiveByStudent(
        studentProfile.id
      );
      if (active) {
        throw new StudentAlreadyEngagedError();
      }

      studentProfile = await this.students.update(studentProfile.id, {
        name: input.name,
        grade: input.grade,
        track: input.track,
      });

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const invitation = await this.invitations.create({
        studentId: studentProfile.id,
        coachId: input.coachId,
        token,
        expiresAt,
      });
      await this.emailService.send({
        to: existingUser.email,
        subject: "Kino Coach koçluk davetin var",
        html: existingStudentInvitationHtml({
          studentName: studentProfile.name,
          coachName,
          dashboardUrl: `${siteUrl}/student/dashboard`,
        }),
        text: `${coachName} seni Kino Coach'ta öğrencisi olmaya davet etti. Daveti görmek için giriş yap: ${siteUrl}/student/dashboard`,
      });
      return {
        studentId: studentProfile.id,
        engagementId: null,
        invitationId: invitation.id,
        invitationToken: invitation.token,
        outcome: "invited_existing_student",
      };
    }

    const authResult = await this.adminAuth.createStudentUser(
      email.value,
      input.name,
      input.inviteRedirectTo
    );
    const student = await this.students.create({
      userId: authResult.userId,
      name: input.name,
      email: email.value,
      grade: input.grade,
      track: input.track,
    });
    const engagement = await this.engagements.create({
      studentId: student.id,
      coachId: input.coachId,
      schoolLevel: input.schoolLevel,
      gradeAtStart: input.grade,
      track: input.track,
    });
    await this.emailService.send({
      to: email.value,
      subject: "Kino Coach davetin",
      html: newStudentInvitationHtml({
        studentName: input.name,
        coachName,
        actionLink: authResult.actionLink,
      }),
      text: `${coachName} seni Kino Coach'a davet etti. Şifreni belirlemek ve giriş yapmak için bağlantıyı aç: ${authResult.actionLink}`,
    });
    return {
      studentId: student.id,
      engagementId: engagement.id,
      invitationId: null,
      invitationToken: null,
      outcome: "created_with_engagement",
    };
  }
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  }
}

function newStudentInvitationHtml(input: {
  studentName: string;
  coachName: string;
  actionLink: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a17;">
      <h2>Kino Coach davetin</h2>
      <p>Merhaba ${escapeHtml(input.studentName)},</p>
      <p>${escapeHtml(input.coachName)} seni Kino Coach'a davet etti.</p>
      <p>Hesabını aktifleştirmek ve şifreni belirlemek için aşağıdaki bağlantıya tıkla:</p>
      <p>
        <a href="${input.actionLink}" style="display: inline-block; padding: 10px 14px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;">
          Şifremi belirle
        </a>
      </p>
      <p style="font-size: 12px; color: #807c72;">Bu bağlantıyı sen talep etmediysen bu e-postayı yok sayabilirsin.</p>
    </div>
  `;
}

function existingStudentInvitationHtml(input: {
  studentName: string;
  coachName: string;
  dashboardUrl: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a17;">
      <h2>Yeni koçluk davetin var</h2>
      <p>Merhaba ${escapeHtml(input.studentName)},</p>
      <p>${escapeHtml(input.coachName)} seni Kino Coach'ta öğrencisi olmaya davet etti.</p>
      <p>Daveti görüntülemek ve yanıtlamak için paneline giriş yap:</p>
      <p>
        <a href="${input.dashboardUrl}" style="display: inline-block; padding: 10px 14px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;">
          Panelime git
        </a>
      </p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
