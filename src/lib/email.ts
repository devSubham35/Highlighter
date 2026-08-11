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

type PasswordResetOTPEmailInput = {
  to: string;
  otp: string;
  expiresInMinutes: number;
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

function publicAssetUrl(path: string, baseUrl: string) {
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
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
  const hasProjects = input.projects.length > 0;
  const projectText = input.projects.join(", ");
  const subject = `${input.inviterName} invited you to ${input.workspaceName}`;
  const safeMessage = input.message?.trim();
  const inviteOrigin = publicAssetUrl("/", input.invitationUrl);
  const inviteGraphicUrl = publicAssetUrl("/assets/Send_email_graphics.png", inviteOrigin);
  const formattedExpiry = formatDate(input.expiresAt);
  const roleText = roleLabel(input.role);

  const text = [
    `${input.inviterName} invited you to ${input.workspaceName}.`,
    `Role: ${roleText}`,
    hasProjects ? `Projects: ${projectText}` : null,
    `Expires: ${formattedExpiry}`,
    safeMessage ? `Message: ${safeMessage}` : null,
    `Accept invitation: ${input.invitationUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const html = `
    <div style="margin:0;padding:34px 18px;background:#fbfcf8;font-family:Inter,Arial,sans-serif;color:#171923">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;margin:0 auto 28px">
        <tr>
          <td align="center" style="padding:0 0 26px">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width:34px;height:34px;border-radius:8px;background:#73bd13;color:#ffffff;font-size:25px;line-height:34px;font-weight:900;text-align:center">H</td>
                <td style="padding-left:10px;font-size:27px;line-height:34px;font-weight:800;color:#111827">Highlight</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dce6d2;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(46,86,20,0.08)">
        <tr>
          <td style="padding:42px 42px 38px;background:#f8fbf1;border-bottom:1px solid #e5eadf">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td valign="middle" style="width:52%;padding-right:24px">
                  <div style="display:inline-block;padding:10px 18px;border-radius:14px;background:#edf5e4;color:#3c7a16;font-size:14px;line-height:18px;font-weight:800">&#128100;&nbsp;&nbsp;You're invited!</div>
                  <h1 style="margin:26px 0 0;font-size:42px;line-height:1.08;color:#111827;font-weight:900;letter-spacing:0">${escapeHtml(input.workspaceName)} invitation <span style="font-size:31px;vertical-align:8%">&#128075;</span></h1>
                  <p style="margin:22px 0 0;font-size:17px;line-height:1.55;color:#5f6675">${escapeHtml(input.inviterName)} invited you to collaborate in ${escapeHtml(input.workspaceName)}.</p>
                </td>
                <td valign="middle" align="right" style="width:48%">
                  <img src="${escapeHtml(inviteGraphicUrl)}" width="330" alt="" style="display:block;width:100%;max-width:330px;height:auto;border:0">
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 42px 34px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width:58px;padding:10px 22px 10px 0"><div style="width:40px;height:40px;border-radius:8px;background:#f0f6e9;color:#3c7a16;font-size:22px;line-height:40px;text-align:center">&#128100;</div></td>
                <td style="padding:10px 0;color:#69707f;font-size:17px">Role</td>
                <td style="padding:10px 0;text-align:right;font-size:17px;font-weight:800;color:#111827">${escapeHtml(roleText)}</td>
              </tr>
              ${
                hasProjects
                  ? `<tr>
                <td style="width:58px;padding:16px 22px 16px 0;border-top:1px solid #e6e9ee"><div style="width:40px;height:40px;border-radius:8px;background:#f0f6e9;color:#3c7a16;font-size:21px;line-height:40px;text-align:center">&#128193;</div></td>
                <td style="padding:16px 0;color:#69707f;font-size:17px;border-top:1px solid #e6e9ee">Projects</td>
                <td style="padding:16px 0;text-align:right;font-size:17px;font-weight:800;color:#111827;border-top:1px solid #e6e9ee">${escapeHtml(projectText)}</td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="width:58px;padding:16px 22px 16px 0;border-top:1px solid #e6e9ee"><div style="width:40px;height:40px;border-radius:8px;background:#f0f6e9;color:#3c7a16;font-size:21px;line-height:40px;text-align:center">&#128197;</div></td>
                <td style="padding:16px 0;color:#69707f;font-size:17px;border-top:1px solid #e6e9ee">Expires</td>
                <td style="padding:16px 0;text-align:right;font-size:17px;font-weight:800;color:#111827;border-top:1px solid #e6e9ee">${escapeHtml(formattedExpiry)}</td>
              </tr>
            </table>
            ${
              safeMessage
                ? `<div style="margin:14px 0 0;padding:16px 18px;border-radius:10px;background:#f8faf5;color:#4c5564;font-size:15px;line-height:1.6">${escapeHtml(safeMessage)}</div>`
                : ""
            }
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 28px">
              <tr>
                <td style="border-radius:8px;background:#3f8b04;box-shadow:inset 0 -2px 0 rgba(0,0,0,0.15)">
                  <a href="${escapeHtml(input.invitationUrl)}" style="display:inline-block;padding:14px 21px;color:#ffffff;text-decoration:none;font-size:17px;font-weight:800">Accept invitation&nbsp;&nbsp;&rarr;</a>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px dashed #d9dde4">
              <tr>
                <td valign="top" style="width:52px;padding:24px 18px 0 0"><div style="width:40px;height:40px;border-radius:8px;background:#f0f6e9;color:#3c7a16;font-size:20px;line-height:40px;text-align:center">&#128737;</div></td>
                <td style="padding:24px 0 0">
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#69707f">If the button does not work, copy and paste this link into your browser:</p>
                  <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#3c7a16;word-break:break-all">${escapeHtml(input.invitationUrl)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;margin:26px auto 0">
        <tr>
          <td align="center" style="font-size:13px;line-height:1.6;color:#69707f">
            <div style="display:inline-block;width:28px;height:28px;margin-bottom:10px;border-radius:50%;background:#edf5e4;color:#3c7a16;line-height:28px;font-size:15px">&#9829;</div><br>
            Thanks for using Highlight.<br>
            The simplest way to report bugs and improve together.
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

export async function sendPasswordResetOTPEmail(input: PasswordResetOTPEmailInput) {
  const { user, adminEmail } = requireEmailEnv();
  const subject = "Reset your Highlight password";
  const text = [
    "Use this verification code to reset your Highlight password:",
    input.otp,
    `This code expires in ${input.expiresInMinutes} minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n\n");

  const html = `
    <div style="margin:0;padding:32px;background:#f6f7f9;font-family:Inter,Arial,sans-serif;color:#171717">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid #eef0f3">
            <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#497d00">Highlight</div>
            <h1 style="margin:12px 0 0;font-size:24px;line-height:1.25;color:#111827">Reset your password</h1>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#4b5563">Enter this code in Highlight to choose a new password.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <div style="display:inline-block;padding:14px 18px;border-radius:10px;background:#f0f7e7;color:#365f00;font-size:28px;letter-spacing:.24em;font-weight:800">${escapeHtml(input.otp)}</div>
            <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#6b7280">This code expires in ${input.expiresInMinutes} minutes. If you did not request this, you can ignore this email.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return getTransporter().sendMail({
    from: `"Highlight" <${user}>`,
    to: input.to,
    replyTo: adminEmail,
    subject,
    text,
    html,
  });
}
