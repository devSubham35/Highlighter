"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { InvitationStatus, MemberRole } from "@prisma/client";
import {
  CalendarClock,
  CheckCircle2,
  LogIn,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
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

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateCopy(state: State, accepted: boolean) {
  if (accepted) {
    return {
      title: "Invitation accepted",
      description: "You are being redirected to the workspace.",
      badge: "Accepted",
      tone: "success" as const,
    };
  }

  if (state === "PENDING") {
    return {
      title: "Workspace invitation",
      description: "Review the details and continue with the invited email address.",
      badge: "Pending invite",
      tone: "success" as const,
    };
  }

  if (state === "INVALID") {
    return {
      title: "Invalid invitation",
      description: "This invitation link is invalid or has been removed.",
      badge: "Invalid link",
      tone: "danger" as const,
    };
  }

  if (state === "CANCELLED") {
    return {
      title: "Invitation cancelled",
      description: "Contact a workspace admin if you need a new invitation.",
      badge: "Cancelled",
      tone: "danger" as const,
    };
  }

  if (state === "REVOKED") {
    return {
      title: "Invitation revoked",
      description: "Contact a workspace admin if you need access again.",
      badge: "Revoked",
      tone: "danger" as const,
    };
  }

  return {
    title: "Invitation expired",
    description: "This link can no longer be used. Ask a workspace admin for a new invitation.",
    badge: "Expired",
    tone: "danger" as const,
  };
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
  const copy = useMemo(() => stateCopy(state, accepted), [accepted, state]);
  const isPending = state === "PENDING" && !accepted;
  const isWrongAccount =
    isPending &&
    Boolean(sessionEmail) &&
    Boolean(invitation) &&
    sessionEmail?.toLowerCase() !== invitation?.email.toLowerCase();

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--auth-grid-soft)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-grid-soft)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-sidebar-border bg-card shadow-xl shadow-primary/5 dark:bg-surface-elevated">
        <div className="border-b border-sidebar-border bg-linear-to-br from-primary/10 via-card to-card p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl",
                copy.tone === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
              )}
            >
              {copy.tone === "success" ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <Badge variant={copy.tone === "success" ? "default" : "destructive"} className="mb-2 rounded-md">
                {copy.badge}
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
            </div>
          </div>
        </div>

        {invitation ? (
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-sidebar-border bg-muted/10 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Workspace</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{invitation.workspace.name}</p>
                </div>
                <Badge variant="outline" className="w-fit rounded-md">
                  {roleLabel(invitation.role)}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={<Avatar className="size-9">
                    {invitation.invitedBy.image ? <AvatarImage src={invitation.invitedBy.image} alt="" /> : null}
                    <AvatarFallback>{initials(invitation.invitedBy.name || invitation.invitedBy.email)}</AvatarFallback>
                  </Avatar>}
                  title={invitation.invitedBy.name || invitation.invitedBy.email}
                  subtitle="Invited you"
                />
                <InfoTile
                  icon={<Mail className="h-4 w-4" />}
                  title={invitation.email}
                  subtitle="Invited account"
                />
                <InfoTile
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title={roleLabel(invitation.role)}
                  subtitle="Workspace role"
                />
                <InfoTile
                  icon={<CalendarClock className="h-4 w-4" />}
                  title={formatExpiry(invitation.expiresAt)}
                  subtitle="Link expires"
                />
              </div>
            </div>

            <div className="rounded-xl border border-sidebar-border bg-card p-4">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Project access</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {invitation.projects.length === 0 ? (
                  <Badge variant="secondary" className="rounded-md">
                    All current projects
                  </Badge>
                ) : (
                  invitation.projects.map((project) => (
                    <Badge key={project.id} variant="secondary" className="rounded-md">
                      {project.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {invitation.message ? (
              <div className="rounded-xl border border-sidebar-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                {invitation.message}
              </div>
            ) : null}

            {isWrongAccount ? (
              <div className="rounded-xl border border-warning/25 bg-warning/10 p-4 text-sm leading-6 text-foreground">
                This invitation was sent to <span className="font-semibold">{invitation.email}</span>. Sign in with that email to accept it.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-6">
            <div className="rounded-xl border border-sidebar-border bg-muted/20 p-4 text-sm text-muted-foreground">
              We could not find invitation details for this link.
            </div>
          </div>
        )}

        {isPending ? (
          <div className="border-t border-sidebar-border p-6">
            {sessionEmail ? (
              <Button className="h-11 w-full" disabled={accepting || isWrongAccount}>
                {accepting ? "Accepting..." : isWrongAccount ? "Sign in with invited email" : "Accept invitation"}
              </Button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  className={cn(buttonVariants({ variant: "default" }), "h-11 w-full")}
                  href={`/register?invite=${inviteParam}&email=${encodeURIComponent(invitation?.email ?? "")}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
                  href={`/login?invite=${inviteParam}&email=${encodeURIComponent(invitation?.email ?? "")}`}
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function InfoTile({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg bg-card p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0 text-sm">
        <p className="truncate font-medium text-foreground">{title}</p>
        <p className="truncate text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
