import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { MemberRole, Membership } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export type ApiErrorResult = { error: NextResponse };
export type SessionResult = { session: SessionData };
export type OrgAccessResult = SessionResult & { membership: Membership };

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
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasMinRole(role: MemberRole, minimum: MemberRole) {
  return roleRank[role] >= roleRank[minimum];
}

export async function requireOrgMembership(
  organizationId: string,
  minimumRole: MemberRole = "MEMBER",
): Promise<ApiErrorResult | OrgAccessResult> {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: authResult.session.user.id,
        organizationId,
      },
    },
  });

  if (!membership) {
    return { error: jsonError("Not found", 404) };
  }

  if (!hasMinRole(membership.role, minimumRole)) {
    return { error: jsonError("Forbidden", 403) };
  }

  return { session: authResult.session, membership };
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function isOrganizationNameTaken(userId: string, name: string, excludeId?: string) {
  const existing = await db.organization.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      name: { equals: name, mode: "insensitive" },
      memberships: { some: { userId } },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function getOrganizationCounts(organizationId: string) {
  const [projectCount, memberCount, pendingInvites] = await Promise.all([
    db.project.count({ where: { organizationId, archived: false } }),
    db.membership.count({ where: { organizationId } }),
    db.invitation.count({ where: { organizationId, status: "PENDING" } }),
  ]);

  return { projectCount, memberCount, pendingInvites };
}

export async function enrichProjects(projects: Array<{ id: string; organizationId: string }>) {
  if (projects.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const organizationId = projects[0]?.organizationId;

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
    organizationId: project.organizationId ?? organizationId,
  }));
}
