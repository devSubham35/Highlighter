import { ProjectDetailsView } from "@/components/projects/ProjectDetailsView";
import { auth } from "@/lib/auth";
import { mergeReportMetadata, parseReportMetadata } from "@/lib/report-metadata";
import type { IssuePriority, IssueType } from "@/types";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const project = await db.project.findFirst({
    where: { id: projectId, workspace: { memberships: { some: { userId } } } },
    include: {
      workspace: {
        include: {
          memberships: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
        },
      },
      reports: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) notFound();

  const members = project.workspace.memberships.map((membership) => membership.user);
  const issues = project.reports
    .map((report, index) => {
      const existing = parseReportMetadata(report.metadata);
      const metadata = mergeReportMetadata(report.metadata, {
        issueNumber: index + 1,
        type: (existing.type ?? (index % 2 === 0 ? "BUG" : "IMPROVEMENT")) as IssueType,
        priority: (existing.priority ?? "NONE") as IssuePriority,
        reporterName: existing.reporterName ?? session!.user.name ?? "Anonymous",
      });
      return {
        id: report.id,
        projectId: report.projectId,
        title: report.title,
        description: report.description,
        status: report.status,
        screenshotUrl: report.screenshotUrl,
        pageUrl: report.pageUrl,
        browser: report.browser,
        os: report.os,
        device: report.device,
        userAgent: report.userAgent,
        metadata,
        createdAt: report.createdAt.toISOString(),
      };
    })
    .reverse();

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading project…</div>}>
      <ProjectDetailsView
        project={{
          id: project.id,
          name: project.name,
          websiteUrl: project.websiteUrl,
        }}
        issues={issues}
        members={members}
        currentUserId={userId}
        currentUserName={session!.user.name}
      />
    </Suspense>
  );
}
