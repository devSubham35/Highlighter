import type { ComboboxOption } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import type { IssuePriority, IssueType, ReportStatus } from "@/types";
import { SpinnerGapIcon, XCircleIcon } from "@phosphor-icons/react";
import {
  AlertCircle,
  ArrowUpCircle,
  BookOpen,
  Bug,
  ChevronsUp,
  Circle,
  CircleCheck,
  Equal,
  ListTodo,
  Lightbulb,
  Minus,
  Sparkles,
  UserRound,
} from "lucide-react";

export const ISSUE_TYPE_OPTIONS: ComboboxOption[] = [
  {
    value: "BUG",
    label: "Bug",
    icon: <Bug className="h-4 w-4 text-destructive" />,
  },
  {
    value: "TASK",
    label: "Task",
    icon: <ListTodo className="h-4 w-4 text-info" />,
  },
  {
    value: "FEATURE",
    label: "Feature",
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
  },
  {
    value: "IMPROVEMENT",
    label: "Improvement",
    icon: <ArrowUpCircle className="h-4 w-4 text-success" />,
  },
  {
    value: "STORY",
    label: "Story",
    icon: <BookOpen className="h-4 w-4 text-warning" />,
  },
];

export const ISSUE_PRIORITY_OPTIONS: ComboboxOption[] = [
  {
    value: "CRITICAL",
    label: "Critical",
    icon: <AlertCircle className="h-4 w-4 text-destructive" />,
  },
  {
    value: "HIGH",
    label: "High",
    icon: <ChevronsUp className="h-4 w-4 text-warning" />,
  },
  {
    value: "MEDIUM",
    label: "Medium",
    icon: <Equal className="h-4 w-4 text-info" />,
  },
  {
    value: "LOW",
    label: "Low",
    icon: <Minus className="h-4 w-4 text-muted-foreground" />,
  },
  {
    value: "NONE",
    label: "No priority",
    icon: (
      <span className="relative flex h-4 w-4 items-center justify-center">
        <Circle className="h-4 w-4 text-info/70" strokeDasharray="3 2" />
        <Minus className="absolute h-2.5 w-2.5 text-info" />
      </span>
    ),
  },
];

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  BUG: "Bug",
  TASK: "Task",
  FEATURE: "Feature",
  IMPROVEMENT: "Improvement",
  STORY: "Story",
};

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  NONE: "No priority",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function issueTypeIcon(type: IssueType) {
  const option = ISSUE_TYPE_OPTIONS.find((item) => item.value === type);
  return option?.icon ?? <Lightbulb className="h-4 w-4 text-success" />;
}

export function issuePriorityIcon(priority: IssuePriority) {
  const option = ISSUE_PRIORITY_OPTIONS.find((item) => item.value === priority);
  return option?.icon ?? <Circle className="h-4 w-4 text-muted-foreground" />;
}

const ASSIGNEE_ICON_SIZE = {
  sm: { box: "h-4 w-4", icon: "h-4 w-4" },
  md: { box: "h-5 w-5", icon: "h-5 w-5" },
  lg: { box: "h-6 w-6", icon: "h-6 w-6" },
} as const;

export function issueUnassignedIcon(size: keyof typeof ASSIGNEE_ICON_SIZE = "sm") {
  const { box, icon } = ASSIGNEE_ICON_SIZE[size];

  return (
    <span className={cn("relative flex items-center justify-center", box)}>
      <UserRound className={cn(icon, "text-muted-foreground")} strokeDasharray="3 2" />
    </span>
  );
}

export function issueAssigneeIcon(hasAssignee: boolean, size: keyof typeof ASSIGNEE_ICON_SIZE = "sm") {
  const { icon } = ASSIGNEE_ICON_SIZE[size];

  return hasAssignee ? (
    <UserRound className={icon} />
  ) : (
    issueUnassignedIcon(size)
  );
}

export function reportStatusIcon(status: ReportStatus, iconSize = 16) {
  if (status === "IN_PROGRESS") {
    return (
      <SpinnerGapIcon
        size={iconSize}
        className="shrink-0 text-warning"
        aria-hidden
      />
    );
  }
  if (status === "CLOSED") {
    return (
      <XCircleIcon size={iconSize} className="shrink-0 text-muted-foreground" aria-hidden />
    );
  }
  if (status === "RESOLVED") {
    return (
      <CircleCheck
        className="shrink-0 text-success"
        style={{ width: iconSize, height: iconSize }}
      />
    );
  }
  return (
    <Circle
      className="shrink-0 text-info"
      style={{ width: iconSize, height: iconSize }}
    />
  );
}

export function isIssueType(value: string): value is IssueType {
  return ISSUE_TYPE_OPTIONS.some((option) => option.value === value);
}

export function isIssuePriority(value: string): value is IssuePriority {
  return ISSUE_PRIORITY_OPTIONS.some((option) => option.value === value);
}

export const ISSUE_STATUS_TRIGGER_CLASS: Record<ReportStatus, string> = {
  OPEN: "border-[var(--status-open-border)] bg-[var(--status-open-bg)] text-[var(--status-open-fg)] hover:!bg-[var(--status-open-bg-hover)]",
  IN_PROGRESS:
    "border-[var(--status-progress-border)] bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] hover:!bg-[var(--status-progress-bg-hover)]",
  RESOLVED:
    "border-[var(--status-resolved-border)] bg-[var(--status-resolved-bg)] text-[var(--status-resolved-fg)] hover:!bg-[var(--status-resolved-bg-hover)]",
  CLOSED:
    "border-border bg-muted text-muted-foreground hover:!bg-secondary dark:hover:!bg-secondary/90",
};

export const ISSUE_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const ISSUE_STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  OPEN: "border-[var(--status-open-border)] bg-[var(--status-open-bg)] text-[var(--status-open-fg)]",
  IN_PROGRESS: "border-[var(--status-progress-border)] bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]",
  RESOLVED: "border-[var(--status-resolved-border)] bg-[var(--status-resolved-bg)] text-[var(--status-resolved-fg)]",
  CLOSED: "border-border bg-muted text-muted-foreground",
};

export const ISSUE_STATUS_OPTION_CLASS: Record<ReportStatus, string> = {
  OPEN: "bg-[var(--status-open-bg)] text-[var(--status-open-fg)] hover:!bg-[var(--status-open-bg-hover)]",
  IN_PROGRESS:
    "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] hover:!bg-[var(--status-progress-bg-hover)]",
  RESOLVED:
    "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-fg)] hover:!bg-[var(--status-resolved-bg-hover)]",
  CLOSED:
    "bg-muted text-muted-foreground hover:!bg-muted/80 dark:bg-muted/50 dark:text-muted-foreground dark:hover:!bg-muted/70",
};
