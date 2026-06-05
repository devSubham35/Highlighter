import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Highlighter,
} from "lucide-react";

const issues = [
  {
    key: "HIG-104",
    title: "Checkout button overlaps on mobile",
    status: "Open",
    statusVariant: "info" as const,
    priority: "High",
    priorityVariant: "warning" as const,
    time: "2h ago",
  },
  {
    key: "HIG-103",
    title: "Hero image fails to load in Safari",
    status: "In progress",
    statusVariant: "warning" as const,
    priority: "Medium",
    priorityVariant: "secondary" as const,
    time: "5h ago",
  },
  {
    key: "HIG-102",
    title: "Footer links return 404",
    status: "Resolved",
    statusVariant: "success" as const,
    priority: "Low",
    priorityVariant: "outline" as const,
    time: "1d ago",
  },
];

const statusIcon = {
  Open: Circle,
  "In progress": Clock,
  Resolved: CheckCircle2,
};

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sidebar-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-sidebar-border bg-muted/50 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Highlighter className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Marketing site</p>
            <p className="text-xs text-muted-foreground">12 open issues</p>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <span className="rounded-md bg-background px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border">
            All statuses
          </span>
          <span className="rounded-md bg-background px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border">
            Any priority
          </span>
        </div>
      </div>

      <div className="divide-y divide-sidebar-border">
        {issues.map((issue) => {
          const StatusIcon = statusIcon[issue.status as keyof typeof statusIcon] ?? AlertCircle;
          return (
            <div
              key={issue.key}
              className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
                  <Badge variant={issue.statusVariant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {issue.status}
                  </Badge>
                  <Badge variant={issue.priorityVariant}>{issue.priority}</Badge>
                </div>
                <p className="truncate text-sm font-medium text-foreground">{issue.title}</p>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                <span>{issue.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-sidebar-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 shrink-0 rounded-md border-2 border-dashed border-primary/40 bg-primary/5" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2 w-32 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-48 rounded-full bg-muted-foreground/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
