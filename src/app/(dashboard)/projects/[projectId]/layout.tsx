import { ProjectShell } from "@/components/projects/ProjectShell";
import { requireProjectAccess } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId, "read");
  if ("error" in access) notFound();

  const project = await db.project.findFirst({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      workspaceId: true,
      workspace: { select: { name: true } },
    },
  });

  if (!project) notFound();

  return (
    <ProjectShell
      projectId={project.id}
      projectName={project.name}
      workspaceName={project.workspace.name}
      websiteUrl={project.websiteUrl}
      workspaceId={project.workspaceId}
    >
      {children}
    </ProjectShell>
  );
}
