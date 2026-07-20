export type ReportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueType = "BUG" | "TASK" | "FEATURE" | "IMPROVEMENT" | "STORY";
export type IssuePriority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};
