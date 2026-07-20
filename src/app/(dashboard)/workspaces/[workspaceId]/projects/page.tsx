import { BreadcrumbHeader } from "@/components/common/BreadcrumbHeader";
import { ContentContainer } from "@/components/common/ContentContainer";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { auth } from "@/lib/auth";
import { canAccessAllWorkspaceProjects, projectAccessWhere } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function WorkspaceProjectsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      memberships: { some: { userId: session!.user.id } },
    },
    include: {
      memberships: {
        where: { userId: session!.user.id },
        select: { role: true },
      },
      projects: {
        include: {
          _count: {
            select: {
              reports: { where: { status: "OPEN" } },
            },
          },
          reports: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) notFound();

  const canSeeAll = canAccessAllWorkspaceProjects(workspace.memberships[0]?.role ?? "VIEWER");
  const visibleProjects = canSeeAll
    ? workspace.projects
    : await db.project.findMany({
        where: { workspaceId: workspace.id, ...projectAccessWhere(session!.user.id) },
        include: {
          _count: { select: { reports: { where: { status: "OPEN" } } } },
          reports: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

  const imageCounts = await db.report.groupBy({
    by: ["projectId"],
    where: {
      screenshotUrl: { not: null },
      project: { workspaceId: workspace.id },
    },
    _count: { _all: true },
  });

  const imageCountMap = new Map(imageCounts.map((row) => [row.projectId, row._count._all]));

  const projects = visibleProjects.map((project) => ({
    id: project.id,
    name: project.name,
    websiteUrl: project.websiteUrl,
    archived: project.archived,
    createdAt: project.createdAt.toISOString(),
    openCount: project._count.reports,
    imageCount: imageCountMap.get(project.id) ?? 0,
    lastIssueAt: project.reports[0]?.createdAt.toISOString() ?? null,
  }));

  return (
    <ContentContainer>
      <div className="space-y-6">
        <BreadcrumbHeader
          items={[
            { label: "Workspaces", href: "/workspaces" },
            { label: workspace.name, href: `/workspaces/${workspaceId}` },
            { label: "Projects" },
          ]}
        />
        <ProjectsView workspaceId={workspaceId} projects={projects} />
      </div>
    </ContentContainer>
  );
}
