import { ProjectShell } from "@/components/projects/ProjectShell";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspace: { memberships: { some: { userId: session!.user.id } } },
    },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      workspaceId: true,
    },
  });

  if (!project) notFound();

  return (
    <ProjectShell
      projectId={project.id}
      projectName={project.name}
      websiteUrl={project.websiteUrl}
      workspaceId={project.workspaceId}
    >
      {children}
    </ProjectShell>
  );
}
