import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@/types";

const labels: Record<ReportStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const variants: Record<ReportStatus, "info" | "warning" | "success" | "secondary"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "secondary",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
