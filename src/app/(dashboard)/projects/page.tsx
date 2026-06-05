import { PageHeader } from "@/components/common/PageHeader";
import { CreateOrganizationForm } from "@/components/projects/CreateOrganizationForm";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizations = await db.organization.findMany({
    where: { memberships: { some: { userId: session!.user.id } } },
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
    orderBy: { createdAt: "asc" },
  });
  const currentOrg = organizations[0];

  if (!currentOrg) {
    return <CreateOrganizationForm />;
  }

  const imageCounts = await db.report.groupBy({
    by: ["projectId"],
    where: {
      screenshotUrl: { not: null },
      project: { organizationId: currentOrg.id },
    },
    _count: { _all: true },
  });

  const imageCountMap = new Map(imageCounts.map((row) => [row.projectId, row._count._all]));

  const projects = currentOrg.projects.map((project) => ({
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
    <div className="space-y-6">
      <PageHeader title="Projects" description={currentOrg.name} />
      <ProjectsView organizationId={currentOrg.id} projects={projects} />
    </div>
  );
}
