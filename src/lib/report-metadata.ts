import type { IssuePriority, IssueType, ReportStatus } from "@/types";

export type ActivityEntry = {
  id: string;
  kind: "reported" | "title_ai" | "status" | "priority";
  at: string;
  actorName?: string;
  issueType?: IssueType;
  fromStatus?: ReportStatus;
  toStatus?: ReportStatus;
  fromPriority?: IssuePriority;
  toPriority?: IssuePriority;
};

export type ReportMetadata = {
  type?: IssueType;
  priority?: IssuePriority;
  assigneeIds?: string[];
  reporterName?: string;
  reporterId?: string;
  issueNumber?: number;
  activityLog?: ActivityEntry[];
};

export function parseReportMetadata(metadata: unknown): ReportMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const raw = metadata as Record<string, unknown>;
  return {
    type: isIssueType(raw.type) ? raw.type : undefined,
    priority: isIssuePriority(raw.priority) ? raw.priority : undefined,
    assigneeIds: Array.isArray(raw.assigneeIds)
      ? raw.assigneeIds.filter((id): id is string => typeof id === "string")
      : undefined,
    reporterName: typeof raw.reporterName === "string" ? raw.reporterName : undefined,
    reporterId: typeof raw.reporterId === "string" ? raw.reporterId : undefined,
    issueNumber: typeof raw.issueNumber === "number" ? raw.issueNumber : undefined,
    activityLog: Array.isArray(raw.activityLog)
      ? raw.activityLog.filter(
          (entry): entry is ActivityEntry =>
            !!entry &&
            typeof entry === "object" &&
            !Array.isArray(entry) &&
            typeof (entry as ActivityEntry).id === "string" &&
            typeof (entry as ActivityEntry).kind === "string" &&
            typeof (entry as ActivityEntry).at === "string",
        )
      : undefined,
  };
}

export function buildDefaultActivityLog(input: {
  createdAt: string;
  issueType: IssueType;
  status: ReportStatus;
  priority: IssuePriority;
  reporterName: string;
  title: string;
  existing?: ActivityEntry[];
}): ActivityEntry[] {
  if (input.existing?.length) return input.existing;

  const created = new Date(input.createdAt).toISOString();
  const entries: ActivityEntry[] = [
    {
      id: "reported",
      kind: "reported",
      at: created,
      actorName: input.reporterName,
      issueType: input.issueType,
    },
    {
      id: "title-ai",
      kind: "title_ai",
      at: created,
    },
  ];

  if (input.status !== "OPEN") {
    entries.push({
      id: "status-initial",
      kind: "status",
      at: created,
      actorName: input.reporterName,
      fromStatus: "OPEN",
      toStatus: input.status,
    });
  }

  if (input.priority !== "NONE") {
    entries.push({
      id: "priority-initial",
      kind: "priority",
      at: created,
      actorName: input.reporterName,
      fromPriority: "NONE",
      toPriority: input.priority,
    });
  }

  return entries;
}

export function appendActivityLog(
  metadata: unknown,
  entry: Omit<ActivityEntry, "id" | "at"> & { at?: string },
): ReportMetadata {
  const parsed = parseReportMetadata(metadata);
  const log = parsed.activityLog ?? [];
  const next: ActivityEntry = {
    id: crypto.randomUUID(),
    at: entry.at ?? new Date().toISOString(),
    kind: entry.kind,
    actorName: entry.actorName,
    issueType: entry.issueType,
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    fromPriority: entry.fromPriority,
    toPriority: entry.toPriority,
  };
  return mergeReportMetadata(metadata, { activityLog: [...log, next] });
}

export function mergeReportMetadata(
  metadata: unknown,
  patch: Partial<ReportMetadata>,
): ReportMetadata {
  return { ...parseReportMetadata(metadata), ...patch };
}

function isIssueType(value: unknown): value is IssueType {
  return value === "BUG" || value === "IMPROVEMENT";
}

function isIssuePriority(value: unknown): value is IssuePriority {
  return (
    value === "NONE" ||
    value === "LOW" ||
    value === "MEDIUM" ||
    value === "HIGH" ||
    value === "URGENT"
  );
}

export function projectIssuePrefix(projectName: string) {
  const words = projectName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ISS";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

export function formatIssueKey(projectName: string, issueNumber: number) {
  return `${projectIssuePrefix(projectName)}-${issueNumber}`;
}
