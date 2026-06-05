import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { StatusBadge } from "@/components/reports/StatusBadge";
import type { ReportStatus, Severity } from "@/types";
import { format } from "date-fns";
import Link from "next/link";

type Report = {
  id: string;
  title: string;
  severity: Severity;
  status: ReportStatus;
  browser: string | null;
  os: string | null;
  createdAt: Date;
};

export function ReportCard({ report }: { report: Report }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="grid gap-3 border-b border-sidebar-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/70 even:bg-muted/40 dark:even:bg-white/2 dark:hover:bg-white/5 md:grid-cols-[1fr_110px_120px_160px_120px]"
    >
      <div>
        <p className="font-medium text-foreground">{report.title}</p>
        <p className="text-xs text-muted-foreground">{format(report.createdAt, "MMM d, yyyy h:mm a")}</p>
      </div>
      <SeverityBadge severity={report.severity} />
      <StatusBadge status={report.status} />
      <p className="text-sm text-muted-foreground">{report.browser ?? "Unknown"}</p>
      <p className="text-sm text-muted-foreground">{report.os ?? "Unknown"}</p>
    </Link>
  );
}
