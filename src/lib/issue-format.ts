import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function formatIssueCreatedAt(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  const relative = formatDistanceToNow(value, { addSuffix: true }).replace(/^about /, "");
  if (isToday(value)) return relative;
  if (isYesterday(value)) return `${relative} · ${format(value, "h:mma").toLowerCase()}`;
  return `${relative} · ${format(value, "do MMMM, hh:mma").toLowerCase()}`;
}

export function formatIssueCreatedAtLong(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "do MMMM, yyyy · h:mma");
}

export function formatIssueReportedAt(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  if (isToday(value)) return `Today, ${format(value, "h:mm a")}`;
  if (isYesterday(value)) return `Yesterday, ${format(value, "h:mm a")}`;
  return format(value, "MMM d, h:mm a");
}
