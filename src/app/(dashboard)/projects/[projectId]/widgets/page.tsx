import { SnippetCopier } from "@/components/projects/SnippetCopier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function ProjectWidgetsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        deletedAt: null,
        memberships: { some: { userId: session!.user.id } },
      },
    },
    select: { id: true, name: true, apiKey: true },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Widget install</h2>
        <p className="mt-1 text-sm text-muted-foreground">Install the feedback widget on your website.</p>
      </div>
      <Card className="border border-sidebar-border shadow-sm dark:bg-surface-elevated">
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
