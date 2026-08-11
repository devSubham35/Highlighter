import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { MemberRole, Membership, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export type ApiErrorResult = { error: NextResponse };
export type SessionResult = { session: SessionData };
export type WorkspaceAccessResult = SessionResult & { membership: Membership };

export function jsonError(message: string | object, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(): Promise<ApiErrorResult | SessionResult> {
  const session = await getSession();
  if (!session) return { error: jsonError("Unauthorized", 401) };
  return { session };
}

const roleRank: Record<MemberRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasMinRole(role: MemberRole, minimum: MemberRole) {
  return roleRank[role] >= roleRank[minimum];
}

export async function requireWorkspaceMembership(
  workspaceId: string,
  minimumRole: MemberRole = "MEMBER",
): Promise<ApiErrorResult | WorkspaceAccessResult> {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult;

  const membership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: authResult.session.user.id,
        workspaceId,
      },
    },
  });

  if (!membership) {
    return { error: jsonError("Not found", 404) };
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: { id: true },
  });

  if (!workspace) {
    return { error: jsonError("Not found", 404) };
  }

  if (membership.suspended) {
    return { error: jsonError("Workspace access suspended", 403) };
  }

  if (!hasMinRole(membership.role, minimumRole)) {
    return { error: jsonError("Forbidden", 403) };
  }

  return { session: authResult.session, membership };
}

export function canManageMembers(role: MemberRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function canWriteWorkspace(role: MemberRole) {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

export function canAccessAllWorkspaceProjects(role: MemberRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function projectAccessWhere(
  userId: string,
  mode: "read" | "write" = "read",
): Prisma.ProjectWhereInput {
  const roleFilter: MemberRole[] =
    mode === "write" ? ["OWNER", "ADMIN", "MEMBER"] : ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

  return {
    OR: [
      {
        workspace: {
          deletedAt: null,
          memberships: {
            some: {
              userId,
              suspended: false,
              role: { in: ["OWNER", "ADMIN"] },
            },
          },
        },
      },
      {
        projectMemberships: {
          some: {
            membership: {
              userId,
              suspended: false,
              role: { in: roleFilter },
            },
          },
        },
      },
    ],
  };
}

export async function requireProjectAccess(
  projectId: string,
  mode: "read" | "write" = "read",
): Promise<ApiErrorResult | (WorkspaceAccessResult & { project: { id: string; workspaceId: string } })> {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });

  if (!project) return { error: jsonError("Not found", 404) };

  const access = await requireWorkspaceMembership(
    project.workspaceId,
    mode === "write" ? "MEMBER" : "VIEWER",
  );
  if ("error" in access) return access;

  if (canAccessAllWorkspaceProjects(access.membership.role)) {
    return { ...access, project };
  }

  const assigned = await db.projectMembership.findUnique({
    where: {
      membershipId_projectId: {
        membershipId: access.membership.id,
        projectId,
      },
    },
  });

  if (!assigned) return { error: jsonError("Project access denied", 403) };
  return { ...access, project };
}

export async function isWorkspaceNameTaken(userId: string, name: string, excludeId?: string) {
  const existing = await db.workspace.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      name: { equals: name, mode: "insensitive" },
      deletedAt: null,
      memberships: { some: { userId } },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function getWorkspaceCounts(workspaceId: string) {
  const [projectCount, memberCount, pendingInvites] = await Promise.all([
    db.project.count({ where: { workspaceId, archived: false } }),
    db.membership.count({ where: { workspaceId } }),
    db.invitation.count({ where: { workspaceId, status: "PENDING" } }),
  ]);

  return { projectCount, memberCount, pendingInvites };
}

export async function enrichProjects(projects: Array<{ id: string; workspaceId: string }>) {
  if (projects.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const workspaceId = projects[0]?.workspaceId;

  const [imageCounts, openCounts, lastIssues] = await Promise.all([
    db.report.groupBy({
      by: ["projectId"],
      where: {
        projectId: { in: projectIds },
        screenshotUrl: { not: null },
      },
      _count: { _all: true },
    }),
    db.report.groupBy({
      by: ["projectId"],
      where: {
        projectId: { in: projectIds },
        status: "OPEN",
      },
      _count: { _all: true },
    }),
    db.report.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["projectId"],
      select: { projectId: true, createdAt: true },
    }),
  ]);

  const imageCountMap = new Map(imageCounts.map((row) => [row.projectId, row._count._all]));
  const openCountMap = new Map(openCounts.map((row) => [row.projectId, row._count._all]));
  const lastIssueMap = new Map(lastIssues.map((row) => [row.projectId, row.createdAt.toISOString()]));

  return projects.map((project) => ({
    ...project,
    openCount: openCountMap.get(project.id) ?? 0,
    imageCount: imageCountMap.get(project.id) ?? 0,
    lastIssueAt: lastIssueMap.get(project.id) ?? null,
    workspaceId: project.workspaceId ?? workspaceId,
  }));
}
