import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type {
  IEmailService,
  SendEmailInput,
} from "@/application/ports/IEmailService";

export class SmtpEmailService implements IEmailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

  async send(input: SendEmailInput): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: requiredEnv("EMAIL_FROM"),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
    } catch (error) {
      console.error("[email] SMTP send failed", error);
      throw new Error(
        "E-posta gönderilemedi. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS ve EMAIL_FROM ayarlarını kontrol edin."
      );
    }
  }

  private getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: requiredEnv("SMTP_HOST"),
        port: Number(process.env.SMTP_PORT ?? "465"),
        secure: process.env.SMTP_SECURE !== "false",
        auth: {
          user: requiredEnv("SMTP_USER"),
          pass: requiredEnv("SMTP_PASS"),
        },
      });
    }
    return this.transporter;
  }
}

export function createSmtpEmailService(): SmtpEmailService {
  return new SmtpEmailService();
}

function requiredEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} tanımlı değil`);
  }
  return value;
}
