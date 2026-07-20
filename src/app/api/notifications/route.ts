import { requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { formatIssueKey, parseReportMetadata } from "@/lib/report-metadata";
import { NextResponse } from "next/server";

type NotificationItem = {
  id: string;
  kind: "issue_created" | "assignment";
  title: string;
  issueTitle: string;
  issueKey: string;
  projectName: string;
  authorName: string;
  createdAt: string;
  href: string;
  assigneeNames?: string[];
};

function assigneeSummary(names: string[]) {
  if (names.length === 0) return "Unassigned issue";
  if (names.length === 1) return `Assigned issue to ${names[0]}`;
  return `Assigned issue to ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export async function GET() {
  const access = await requireSession();
  if ("error" in access) return access.error;

  const reports = await db.report.findMany({
    where: {
      project: {
        workspace: {
          memberships: { some: { userId: access.session.user.id } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  const notifications: NotificationItem[] = reports.flatMap((report) => {
    const metadata = parseReportMetadata(report.metadata);
    const issueKey = formatIssueKey(report.project.name, metadata.issueNumber ?? 1);
    const href = `/projects/${report.projectId}?issue=${report.id}`;
    const reporterName = metadata.reporterName ?? "Anonymous";

    const items: NotificationItem[] = [
      {
        id: `${report.id}:created`,
        kind: "issue_created",
        title: "New issue created",
        issueTitle: report.title,
        issueKey,
        projectName: report.project.name,
        authorName: reporterName,
        createdAt: report.createdAt.toISOString(),
        href,
      },
    ];

    for (const entry of metadata.activityLog ?? []) {
      if (entry.kind !== "assignment") continue;
      const assigneeNames = entry.toAssigneeNames ?? [];
      items.push({
        id: `${report.id}:${entry.id}`,
        kind: "assignment",
        title: assigneeSummary(assigneeNames),
        issueTitle: report.title,
        issueKey,
        projectName: report.project.name,
        authorName: entry.actorName ?? "Someone",
        createdAt: entry.at,
        href,
        assigneeNames,
      });
    }

    return items;
  });

  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json({ notifications: notifications.slice(0, 20) });
}
