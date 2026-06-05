import { ProjectGeneralSettings } from "@/components/projects/ProjectGeneralSettings";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const project = await db.project.findFirst({
    where: { id: projectId, workspace: { memberships: { some: { userId: session!.user.id } } } },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      workspaceId: true,
    },
  });
  if (!project) notFound();

  return (
    <ProjectGeneralSettings
      project={{
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
      }}
      workspaceId={project.workspaceId}
    />
  );
}
