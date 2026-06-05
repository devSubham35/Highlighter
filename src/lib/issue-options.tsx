import type { ComboboxOption } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import type { IssuePriority, IssueType, ReportStatus } from "@/types";
import { SpinnerGapIcon, XCircleIcon } from "@phosphor-icons/react";
import {
  AlertCircle,
  ArrowUpCircle,
  Bug,
  ChevronsUp,
  Circle,
  CircleCheck,
  Equal,
  Lightbulb,
  Minus,
  UserRound,
} from "lucide-react";

export const ISSUE_TYPE_OPTIONS: ComboboxOption[] = [
  {
    value: "BUG",
    label: "Bug",
    icon: <Bug className="h-4 w-4 text-destructive" />,
  },
  {
    value: "IMPROVEMENT",
    label: "Improvement",
    icon: <ArrowUpCircle className="h-4 w-4 text-emerald-600" />,
  },
];

export const ISSUE_PRIORITY_SHORTCUTS: Record<IssuePriority, string | undefined> = {
  URGENT: "U",
  HIGH: "1",
  MEDIUM: "2",
  LOW: "3",
  NONE: "4",
};

export const ISSUE_PRIORITY_OPTIONS: ComboboxOption[] = [
  {
    value: "URGENT",
    label: "Urgent",
    icon: <AlertCircle className="h-4 w-4 text-red-600" />,
  },
  {
    value: "HIGH",
    label: "High",
    icon: <ChevronsUp className="h-4 w-4 text-orange-600" />,
  },
  {
    value: "MEDIUM",
    label: "Medium",
    icon: <Equal className="h-4 w-4 text-sky-600" />,
  },
  {
    value: "LOW",
    label: "Low",
    icon: <Minus className="h-4 w-4 text-[#80868b]" />,
  },
  {
    value: "NONE",
    label: "No priority",
    icon: (
      <span className="relative flex h-4 w-4 items-center justify-center">
        <Circle className="h-4 w-4 text-sky-400" strokeDasharray="3 2" />
        <Minus className="absolute h-2.5 w-2.5 text-sky-500" />
      </span>
    ),
  },
];

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  BUG: "Bug",
  IMPROVEMENT: "Improvement",
};

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  NONE: "No priority",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function issueTypeIcon(type: IssueType) {
  return type === "BUG" ? (
    <Bug className="h-4 w-4 text-destructive" />
  ) : (
    <Lightbulb className="h-4 w-4 text-emerald-600" />
  );
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
      <UserRound className={cn(icon, "text-[#80868b]")} strokeDasharray="3 2" />
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
        className="shrink-0 text-amber-600"
        aria-hidden
      />
    );
  }
  if (status === "CLOSED") {
    return (
      <XCircleIcon size={iconSize} className="shrink-0 text-gray-500" aria-hidden />
    );
  }
  if (status === "RESOLVED") {
    return (
      <CircleCheck
        className="shrink-0 text-emerald-600"
        style={{ width: iconSize, height: iconSize }}
      />
    );
  }
  return (
    <Circle
      className="shrink-0 text-sky-600"
      style={{ width: iconSize, height: iconSize }}
    />
  );
}

export function isIssueType(value: string): value is IssueType {
  return value === "BUG" || value === "IMPROVEMENT";
}

export function isIssuePriority(value: string): value is IssuePriority {
  return ISSUE_PRIORITY_OPTIONS.some((option) => option.value === value);
}

export const ISSUE_STATUS_TRIGGER_CLASS: Record<ReportStatus, string> = {
  OPEN: "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] hover:!bg-[#BBF7D0] dark:border-success/20 dark:bg-success/15 dark:text-[#4ADE80]",
  IN_PROGRESS:
    "border-[#FDE68A] bg-[#FEF3C7] text-[#B45309] hover:!bg-[#FDE68A] dark:border-warning/20 dark:bg-warning/15 dark:text-[#FBBF24]",
  RESOLVED:
    "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] hover:!bg-[#BBF7D0] dark:border-success/20 dark:bg-success/15 dark:text-[#4ADE80]",
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
  OPEN: "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D]",
  IN_PROGRESS: "border-[#FDE68A] bg-[#FEF3C7] text-[#B45309]",
  RESOLVED: "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D]",
  CLOSED: "border-border bg-muted text-muted-foreground",
};
