import { PageHeader } from "@/components/common/PageHeader";
import { SnippetCopier } from "@/components/projects/SnippetCopier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const project = await db.project.findFirst({
    where: { id: projectId, organization: { memberships: { some: { userId: session!.user.id } } } },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`${project.name} settings`} description="Widget installation and project configuration." />
      <Card className="border border-sidebar-border shadow-sm dark:bg-[#1a1d21]">
        <CardHeader>
          <CardTitle>Install widget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Install this snippet on the site you want to collect reports from.
          </p>
          <SnippetCopier apiKey={project.apiKey} />
        </CardContent>
      </Card>
    </div>
  );
}
