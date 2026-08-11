import { InvitationAcceptView } from "@/components/members/InvitationAcceptView";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInvitationToken } from "@/lib/invitation-token";
import { headers } from "next/headers";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const parsed = parseInvitationToken(token);

  if (!parsed) {
    return <InvitationAcceptView token={token} sessionEmail={session?.user.email ?? null} state="INVALID" />;
  }

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
      projects: { include: { project: { select: { id: true, name: true } } } },
    },
  });

  if (!invitation) {
    return <InvitationAcceptView token={token} sessionEmail={session?.user.email ?? null} state="INVALID" />;
  }

  const state =
    invitation.status === "ACCEPTED" || (invitation.status === "PENDING" && invitation.expiresAt < new Date())
      ? "EXPIRED"
      : invitation.status;

  return (
    <InvitationAcceptView
      token={token}
      sessionEmail={session?.user.email ?? null}
      state={state}
      invitation={{
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
        message: invitation.message,
        workspace: invitation.workspace,
        invitedBy: invitation.invitedBy,
        projects: invitation.projects.map((item) => item.project),
      }}
    />
  );
}
