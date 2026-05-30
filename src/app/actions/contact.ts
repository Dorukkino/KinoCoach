"use server";

import { redirect } from "next/navigation";
import { createSmtpEmailService } from "@/infrastructure/email/SmtpEmailService";

export async function sendContactMessageAction(formData: FormData) {
  const fullName = readFormValue(formData, "fullName");
  const email = readFormValue(formData, "email");
  const subject = readFormValue(formData, "subject");
  const message = readFormValue(formData, "message");
  const roles = formData
    .getAll("role")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!fullName || !email || !subject || !message || roles.length === 0) {
    redirect("/iletisim?durum=eksik#iletisim-formu");
  }

  try {
    await createSmtpEmailService().send({
      to: resolveContactRecipient(),
      subject: `KinoCoach iletişim formu: ${subject}`,
      html: contactMessageHtml({ fullName, email, roles, subject, message }),
      text: [
        `Ad Soyad: ${fullName}`,
        `E-posta: ${email}`,
        `Rol: ${roles.join(", ")}`,
        `Konu: ${subject}`,
        "",
        message,
      ].join("\n"),
    });
  } catch {
    redirect("/iletisim?durum=hata#iletisim-formu");
  }

  redirect("/iletisim?durum=basarili#iletisim-formu");
}

function readFormValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function resolveContactRecipient(): string {
  const recipient = process.env.CONTACT_EMAIL?.trim() || process.env.EMAIL_FROM?.trim();
  if (!recipient) {
    throw new Error("CONTACT_EMAIL veya EMAIL_FROM tanımlı değil");
  }
  return recipient;
}

function contactMessageHtml(input: {
  fullName: string;
  email: string;
  roles: string[];
  subject: string;
  message: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a17;">
      <h2>Yeni iletişim formu mesajı</h2>
      <p><strong>Ad Soyad:</strong> ${escapeHtml(input.fullName)}</p>
      <p><strong>E-posta:</strong> ${escapeHtml(input.email)}</p>
      <p><strong>Rol:</strong> ${escapeHtml(input.roles.join(", "))}</p>
      <p><strong>Konu:</strong> ${escapeHtml(input.subject)}</p>
      <hr style="border: 0; border-top: 1px solid #e5e0d8;" />
      <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
