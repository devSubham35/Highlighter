import { ContentContainer } from "@/components/common/ContentContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { auth } from "@/lib/auth";
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

  const organization = await db.organization.findFirst({
    where: {
      id: workspaceId,
      memberships: { some: { userId: session!.user.id } },
    },
    include: {
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

  if (!organization) notFound();

  const imageCounts = await db.report.groupBy({
    by: ["projectId"],
    where: {
      screenshotUrl: { not: null },
      project: { organizationId: organization.id },
    },
    _count: { _all: true },
  });

  const imageCountMap = new Map(imageCounts.map((row) => [row.projectId, row._count._all]));

  const projects = organization.projects.map((project) => ({
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
        <PageHeader title="Projects" description={organization.name} backHref="/workspaces" />
        <ProjectsView organizationId={organization.id} workspaceId={workspaceId} projects={projects} />
      </div>
    </ContentContainer>
  );
}
