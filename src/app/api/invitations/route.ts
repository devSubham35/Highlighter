import { jsonError, requireSession, requireWorkspaceMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { inviteMemberSchema } from "@/lib/validations";
import { addDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return jsonError("workspaceId required", 400);
  }

  const access = await requireWorkspaceMembership(workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  const invitations = await db.invitation.findMany({
    where: { workspaceId },
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

  const access = await requireWorkspaceMembership(parsed.data.workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  const email = parsed.data.email.toLowerCase();

  const existingMember = await db.membership.findFirst({
    where: {
      workspaceId: parsed.data.workspaceId,
      user: { email: { equals: email, mode: "insensitive" } },
    },
  });

  if (existingMember) {
    return jsonError("This user is already a workspace member.", 409);
  }

  const pendingInvite = await db.invitation.findFirst({
    where: {
      workspaceId: parsed.data.workspaceId,
      email: { equals: email, mode: "insensitive" },
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingInvite) {
    return jsonError("A pending invitation already exists for this email.", 409);
  }

  const invitation = await db.invitation.create({
    data: {
      ...parsed.data,
      email,
      invitedById: authResult.session.user.id,
      expiresAt: addDays(new Date(), 7),
    },
  });

  return NextResponse.json(invitation, { status: 201 });
}
