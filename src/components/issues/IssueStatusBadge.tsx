"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ISSUE_STATUS_BADGE_CLASS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_OPTION_CLASS,
  reportStatusIcon,
} from "@/lib/issue-options";
import { REPORT_STATUS_OPTIONS, isReportStatus } from "@/lib/report-options";
import type { ReportStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

export function IssueStatusBadge({
  status,
  onStatusChange,
}: {
  status: ReportStatus;
  onStatusChange: (status: ReportStatus) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all duration-200 hover:opacity-90",
          ISSUE_STATUS_BADGE_CLASS[status],
        )}
        aria-label="Change status"
      >
        {reportStatusIcon(status, 14)}
        {ISSUE_STATUS_LABELS[status]}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end">
        {REPORT_STATUS_OPTIONS.map((option) => {
          const value = option.value as ReportStatus;
          const selected = value === status;
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              className={cn(
                "h-auto w-full justify-start gap-2 rounded-md px-2 py-2 pr-8 text-left text-sm font-normal",
                selected && ISSUE_STATUS_OPTION_CLASS[value],
              )}
              onClick={() => {
                if (!isReportStatus(option.value)) return;
                onStatusChange(option.value);
              }}
            >
              {reportStatusIcon(value, 16)}
              {ISSUE_STATUS_LABELS[value]}
              {selected ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
            </Button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function IssueStatusInline({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium",
        ISSUE_STATUS_BADGE_CLASS[status],
      )}
    >
      {reportStatusIcon(status, 14)}
      {ISSUE_STATUS_LABELS[status]}
    </span>
  );
}

export { reportStatusIcon as statusIcon };
