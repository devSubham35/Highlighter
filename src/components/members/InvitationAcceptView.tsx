"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { InvitationStatus, MemberRole } from "@prisma/client";
import { CheckCircle2, LogIn, ShieldAlert, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type State = InvitationStatus | "INVALID";

function initials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(role: MemberRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function InvitationAcceptView({
  token,
  sessionEmail,
  state,
  invitation,
}: {
  token: string;
  sessionEmail: string | null;
  state: State;
  invitation?: {
    email: string;
    role: MemberRole;
    expiresAt: string;
    message: string | null;
    workspace: { id: string; name: string };
    invitedBy: { id: string; name: string; email: string; image?: string | null };
    projects: Array<{ id: string; name: string }>;
  };
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const inviteParam = encodeURIComponent(token);

  const title = useMemo(() => {
    if (accepted) return "Invitation accepted";
    if (state === "INVALID") return "Invalid invitation";
    if (state === "EXPIRED") return "Invitation expired";
    if (state === "CANCELLED") return "Invitation cancelled";
    if (state === "REVOKED") return "Invitation revoked";
    if (state === "ACCEPTED") return "Already accepted";
    return `Join ${invitation?.workspace.name ?? "workspace"}`;
  }, [accepted, invitation?.workspace.name, state]);

  useEffect(() => {
    if (!sessionEmail || state !== "PENDING" || accepting || accepted) return;
    if (invitation?.email.toLowerCase() !== sessionEmail.toLowerCase()) return;

    async function accept() {
      setAccepting(true);
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json();
      setAccepting(false);
      if (!response.ok) {
        toast.error("Could not accept invitation", typeof payload.error === "string" ? payload.error : "Try again.");
        return;
      }
      setAccepted(true);
      toast.success("Welcome to the workspace");
      window.setTimeout(() => router.push(`/workspaces/${payload.workspace.id}`), 1200);
    }

    accept();
  }, [accepted, accepting, invitation?.email, router, sessionEmail, state, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:bg-surface-elevated">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {accepted || state === "PENDING" ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {state === "PENDING"
                ? "Your invitation context will be preserved through sign up or login."
                : "Contact a workspace admin if you need a new invitation."}
            </p>
          </div>
        </div>

        {invitation ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-sidebar-border bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">Workspace</p>
              <p className="mt-1 text-lg font-semibold">{invitation.workspace.name}</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="size-9">
                  {invitation.invitedBy.image ? <AvatarImage src={invitation.invitedBy.image} alt="" /> : null}
                  <AvatarFallback>{initials(invitation.invitedBy.name || invitation.invitedBy.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{invitation.invitedBy.name}</p>
                  <p className="truncate text-muted-foreground">Invited you as {roleLabel(invitation.role)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {invitation.projects.length === 0 ? (
                <Badge variant="secondary" className="rounded-md">All current projects</Badge>
              ) : (
                invitation.projects.map((project) => (
                  <Badge key={project.id} variant="secondary" className="rounded-md">
                    {project.name}
                  </Badge>
                ))
              )}
            </div>
            {invitation.message ? <p className="rounded-xl bg-muted p-4 text-sm">{invitation.message}</p> : null}
          </div>
        ) : null}

        {state === "PENDING" && !accepted ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {sessionEmail ? (
              <Button className="w-full sm:col-span-2" disabled={accepting}>
                {accepting ? "Accepting..." : "Accepting invitation..."}
              </Button>
            ) : (
              <>
                <Link
                  className={cn(buttonVariants({ variant: "default" }), "w-full")}
                  href={`/register?invite=${inviteParam}&email=${encodeURIComponent(invitation?.email ?? "")}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  href={`/login?invite=${inviteParam}&email=${encodeURIComponent(invitation?.email ?? "")}`}
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
