import type { MemberRole } from "@prisma/client";
import nodemailer from "nodemailer";

type InvitationEmailInput = {
  to: string;
  invitationUrl: string;
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  role: MemberRole;
  projects: string[];
  expiresAt: Date;
  message?: string | null;
};

function requireEmailEnv() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || user;
  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured for SMTP delivery.");
  }
  return { user, pass: pass.replace(/\s+/g, ""), adminEmail };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function roleLabel(role: MemberRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTransporter() {
  const { user, pass } = requireEmailEnv();
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export async function sendInvitationEmail(input: InvitationEmailInput) {
  const { user, adminEmail } = requireEmailEnv();
  const fromName = `${input.inviterName} via Highlight`;
  const projectText =
    input.projects.length > 0 ? input.projects.join(", ") : "All current projects";
  const subject = `${input.inviterName} invited you to ${input.workspaceName}`;
  const safeMessage = input.message?.trim();

  const text = [
    `${input.inviterName} invited you to ${input.workspaceName}.`,
    `Role: ${roleLabel(input.role)}`,
    `Projects: ${projectText}`,
    `Expires: ${formatDate(input.expiresAt)}`,
    safeMessage ? `Message: ${safeMessage}` : null,
    `Accept invitation: ${input.invitationUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const html = `
    <div style="margin:0;padding:32px;background:#f6f7f9;font-family:Inter,Arial,sans-serif;color:#171717">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid #eef0f3">
            <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb">Highlight</div>
            <h1 style="margin:12px 0 0;font-size:24px;line-height:1.25;color:#111827">${escapeHtml(input.workspaceName)} invitation</h1>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#4b5563">${escapeHtml(input.inviterName)} invited you to collaborate in ${escapeHtml(input.workspaceName)}.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px">
              <tr>
                <td style="padding:12px 0;color:#6b7280;font-size:13px">Role</td>
                <td style="padding:12px 0;text-align:right;font-size:14px;font-weight:700;color:#111827">${roleLabel(input.role)}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;color:#6b7280;font-size:13px;border-top:1px solid #eef0f3">Projects</td>
                <td style="padding:12px 0;text-align:right;font-size:14px;font-weight:700;color:#111827;border-top:1px solid #eef0f3">${escapeHtml(projectText)}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;color:#6b7280;font-size:13px;border-top:1px solid #eef0f3">Expires</td>
                <td style="padding:12px 0;text-align:right;font-size:14px;font-weight:700;color:#111827;border-top:1px solid #eef0f3">${escapeHtml(formatDate(input.expiresAt))}</td>
              </tr>
            </table>
            ${
              safeMessage
                ? `<div style="margin:0 0 22px;padding:16px;border-radius:10px;background:#f9fafb;color:#374151;font-size:14px;line-height:1.6">${escapeHtml(safeMessage)}</div>`
                : ""
            }
            <a href="${escapeHtml(input.invitationUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">Accept invitation</a>
            <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6b7280">If the button does not work, copy and paste this link into your browser:<br>${escapeHtml(input.invitationUrl)}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return getTransporter().sendMail({
    from: `"${fromName.replace(/"/g, "'")}" <${user}>`,
    to: input.to,
    replyTo: input.inviterEmail || adminEmail,
    subject,
    text,
    html,
  });
}
