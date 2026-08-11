import { jsonError, requireSession, requireWorkspaceMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { createInvitationToken, invitationUrl } from "@/lib/invitation-token";
import { inviteMemberSchema } from "@/lib/validations";
import { addDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

const INVITATION_EXPIRY_DAYS = 2;

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return jsonError("workspaceId required", 400);
  }

  const access = await requireWorkspaceMembership(workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  const invitations = await db.invitation.findMany({
    where: { workspaceId },
    include: {
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
      projects: { include: { project: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const parsed = inviteMemberSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const access = await requireWorkspaceMembership(parsed.data.workspaceId, "OWNER");
  if ("error" in access) return access.error;

  const workspace = await db.workspace.findUnique({
    where: { id: parsed.data.workspaceId },
    include: { projects: { select: { id: true, name: true } } },
  });

  if (!workspace) return jsonError("Workspace not found", 404);

  const projectIds = Array.from(new Set(parsed.data.projectIds));
  const validProjectIds = new Set(workspace.projects.map((project) => project.id));
  if (projectIds.some((projectId) => !validProjectIds.has(projectId))) {
    return jsonError("One or more projects do not belong to this workspace.", 400);
  }

  const emails = Array.from(
    new Set([...(parsed.data.emails ?? []), ...(parsed.data.email ? [parsed.data.email] : [])].map((email) => email.toLowerCase())),
  );

  const selfEmail = authResult.session.user.email?.toLowerCase();
  if (selfEmail && emails.includes(selfEmail)) {
    return jsonError(
      {
        message: "You cannot invite yourself.",
        emails: [selfEmail],
      },
      400,
    );
  }

  const [existingMembers, pendingInvites] = await Promise.all([
    db.membership.findMany({
      where: {
        workspaceId: parsed.data.workspaceId,
        user: { email: { in: emails, mode: "insensitive" } },
      },
      include: {
        user: { select: { email: true } },
        projectMemberships: { select: { projectId: true } },
      },
    }),
    db.invitation.findMany({
      where: {
        workspaceId: parsed.data.workspaceId,
        email: { in: emails, mode: "insensitive" },
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { email: true },
    }),
  ]);

  const workspaceMemberEmails = existingMembers.map((member) => member.user.email.toLowerCase());
  const projectMemberEmails =
    projectIds.length === 0
      ? []
      : existingMembers
          .filter((member) => {
            if (["OWNER", "ADMIN"].includes(member.role)) return true;
            const assignedProjectIds = new Set(member.projectMemberships.map((projectMembership) => projectMembership.projectId));
            return projectIds.some((projectId) => assignedProjectIds.has(projectId));
          })
          .map((member) => member.user.email.toLowerCase());
  const pendingInviteEmails = pendingInvites.map((invite) => invite.email.toLowerCase());
  const blocked = new Set([...workspaceMemberEmails, ...pendingInviteEmails]);

  if (blocked.size > 0) {
    const emailsList = Array.from(blocked);
    const message =
      projectMemberEmails.length > 0
        ? "Some email addresses already have access to the selected project or workspace."
        : "Some email addresses are already workspace members or have pending invitations.";

    return jsonError(
      {
        message,
        emails: emailsList,
        workspaceMembers: workspaceMemberEmails,
        projectMembers: projectMemberEmails,
        pendingInvites: pendingInviteEmails,
      },
      409,
    );
  }

  const invitations = [];
  const deliveryErrors: Array<{ email: string; error: string }> = [];

  for (const email of emails) {
    const created = await db.invitation.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        email,
        role: parsed.data.role,
        message: parsed.data.message,
        invitedById: authResult.session.user.id,
        expiresAt: addDays(new Date(), INVITATION_EXPIRY_DAYS),
        projects: {
          create: projectIds.map((projectId) => ({ projectId })),
        },
      },
      include: {
        invitedBy: { select: { id: true, name: true, email: true, image: true } },
        projects: { include: { project: { select: { id: true, name: true } } } },
      },
    });

    const token = createInvitationToken(created.id);
    const invitation = await db.invitation.update({
      where: { id: created.id },
      data: { token },
      include: {
        invitedBy: { select: { id: true, name: true, email: true, image: true } },
        projects: { include: { project: { select: { id: true, name: true } } } },
      },
    });

    const inviteUrl = invitationUrl(token, req.nextUrl.origin);
    const emailPreview = {
      subject: `${authResult.session.user.name ?? "A teammate"} invited you to ${workspace.name}`,
      workspaceName: workspace.name,
      inviterName: authResult.session.user.name ?? authResult.session.user.email,
      role: invitation.role,
      projects: invitation.projects.map((item) => item.project.name),
      expiresAt: invitation.expiresAt,
      message: invitation.message,
    };

    try {
      await sendInvitationEmail({
        to: invitation.email,
        invitationUrl: inviteUrl,
        workspaceName: workspace.name,
        inviterName: authResult.session.user.name ?? authResult.session.user.email,
        inviterEmail: authResult.session.user.email,
        role: invitation.role,
        projects: invitation.projects.map((item) => item.project.name),
        expiresAt: invitation.expiresAt,
        message: invitation.message,
      });
    } catch (error) {
      deliveryErrors.push({
        email: invitation.email,
        error: error instanceof Error ? error.message : "Unknown SMTP delivery error",
      });
    }

    invitations.push({
      ...invitation,
      invitationUrl: inviteUrl,
      emailPreview,
    });
  }

  return NextResponse.json(
    {
      invitations,
      sent: invitations.length,
      delivered: invitations.length - deliveryErrors.length,
      deliveryErrors,
    },
    { status: deliveryErrors.length === invitations.length ? 502 : 201 },
  );
}
