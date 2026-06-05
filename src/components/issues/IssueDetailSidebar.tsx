"use client";

import { IssuePickerPanel } from "@/components/issues/IssuePickerPanel";
import { IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import { formatIssueReportedAt } from "@/lib/issue-format";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_PRIORITY_SHORTCUTS,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_OPTIONS,
  issuePriorityIcon,
  issueTypeIcon,
  issueUnassignedIcon,
  isIssuePriority,
  isIssueType,
} from "@/lib/issue-options";
import { formatIssueKey, parseReportMetadata } from "@/lib/report-metadata";
import type { IssueItem } from "@/components/projects/ProjectDetailsView";
import type { IssuePriority, IssueType, OrgMember } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Laptop,
  Monitor,
  Smartphone,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";

function SessionIcons({ os, browser, device }: { os: string | null; browser: string | null; device: string | null }) {
  const isMobile = device?.toLowerCase().includes("mobile");
  return (
    <div className="flex items-center gap-2 text-[#5f6368]">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f1f3f4]" title={os ?? "OS"}>
        <Laptop className="h-4 w-4" />
      </span>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f1f3f4]" title={browser ?? "Browser"}>
        <Globe className="h-4 w-4" />
      </span>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f1f3f4]"
        title={device ?? "Device"}
      >
        {isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
      </span>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  trailing,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-[#e8eaed] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground"
      >
        <span>{title}</span>
        <span className="flex items-center gap-2">
          {!open ? trailing : null}
          <ChevronDown
            className={cn("h-4 w-4 text-[#80868b] transition-transform", open && "rotate-180")}
          />
        </span>
      </button>
      {open ? <div className="border-t border-[#e8eaed] px-3 py-3">{children}</div> : null}
    </div>
  );
}

const PROPERTY_ICON_SLOT = "flex size-6 shrink-0 items-center justify-center";

function PropertyRow({
  label,
  children,
  interactive = false,
}: {
  label: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-3 text-sm">
      <span className="text-[#80868b]">{label}</span>
      <div
        className={cn(
          "flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground",
          interactive &&
            "cursor-pointer transition-colors hover:bg-[#f1f3f4] dark:hover:bg-[#FFFFFF14]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function IssueDetailSidebar({
  detail,
  projectName,
  members,
  reporterName,
  reporterImage,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onPatch,
}: {
  detail: IssueItem;
  projectName: string;
  members: OrgMember[];
  reporterName: string;
  reporterImage?: string | null;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPatch: (patch: { metadata?: Record<string, unknown> }) => void;
}) {
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const parsed = parseReportMetadata(detail.metadata);
  const issueType: IssueType = parsed.type ?? "IMPROVEMENT";
  const priority: IssuePriority = parsed.priority ?? "NONE";
  const assigneeIds = parsed.assigneeIds ?? [];
  const issueNumber = parsed.issueNumber ?? 1;

  const issueKey = formatIssueKey(projectName, issueNumber);
  const assignees = members.filter((member) => assigneeIds.includes(member.id));
  const primaryAssignee = assignees[0];

  const priorityItems = useMemo(
    () =>
      ISSUE_PRIORITY_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        icon: option.icon,
        shortcut: ISSUE_PRIORITY_SHORTCUTS[option.value as IssuePriority],
      })),
    [],
  );

  const assigneeItems = useMemo(
    () =>
      members.map((member) => ({
        value: member.id,
        label: member.name || member.email,
        avatarName: member.name || member.email,
        avatarImage: member.image,
      })),
    [members],
  );

  const pickerTriggerClass =
    "inline-flex min-w-0 flex-1 items-center gap-2 text-left outline-none";

  return (
    <aside className="flex w-[min(360px,32vw)] min-w-[300px] shrink-0 flex-col border-l border-[#e8eaed] bg-[#f8f9fa]">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-0.5 text-sm text-[#5f6368]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={currentIndex <= 0}
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4.5rem] text-center tabular-nums">
            {currentIndex + 1} of {totalCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={currentIndex >= totalCount - 1}
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-[#5f6368]" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5">
        <div className="rounded-lg border border-[#e8eaed] bg-white p-3.5">
          <div className="flex items-start gap-2.5">
            <IssueUserAvatar
              name={reporterName}
              image={reporterImage}
              className="size-9"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Reported by <span className="font-semibold">{reporterName}</span>
              </p>
              <p className="mt-0.5 text-xs text-[#80868b]">{formatIssueReportedAt(detail.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-0.5 rounded-lg border border-[#e8eaed] bg-white px-3.5 py-2">
          <PropertyRow label="ID">
            <span className={PROPERTY_ICON_SLOT}>
              <span className="text-sm font-semibold text-foreground">#</span>
            </span>
            <span className="min-w-0 truncate">{issueKey}</span>
          </PropertyRow>
          <PropertyRow label="Type" interactive>
            <span className={PROPERTY_ICON_SLOT}>{issueTypeIcon(issueType)}</span>
            <div className="min-w-0 flex-1">
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger className={pickerTriggerClass}>
                  <span className="min-w-0 truncate">{ISSUE_TYPE_LABELS[issueType]}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                  <IssuePickerPanel
                    searchPlaceholder="Change type…"
                    items={ISSUE_TYPE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                      icon: option.icon,
                    }))}
                    value={issueType}
                    onSelect={(value) => {
                      if (!isIssueType(value)) return;
                      onPatch({ metadata: { type: value } });
                      setTypeOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </PropertyRow>
          <PropertyRow label="Assignee" interactive>
            <span className={PROPERTY_ICON_SLOT}>
              {primaryAssignee ? (
                <IssueUserAvatar
                  name={primaryAssignee.name || primaryAssignee.email}
                  image={primaryAssignee.image}
                  className="size-6"
                />
              ) : (
                issueUnassignedIcon()
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                <PopoverTrigger className={pickerTriggerClass}>
                  <span
                    className={cn(
                      "min-w-0 truncate",
                      !primaryAssignee && "text-[#80868b]",
                    )}
                  >
                    {primaryAssignee
                      ? primaryAssignee.name || primaryAssignee.email
                      : "No assignee"}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                  <IssuePickerPanel
                    searchPlaceholder="Assign to…"
                    commandShortcut="A"
                    items={assigneeItems}
                    values={assigneeIds}
                    multiple
                    onValuesChange={(ids) => onPatch({ metadata: { assigneeIds: ids } })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </PropertyRow>
          <PropertyRow label="Priority" interactive>
            <span className={PROPERTY_ICON_SLOT}>{issuePriorityIcon(priority)}</span>
            <div className="min-w-0 flex-1">
              <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                <PopoverTrigger className={pickerTriggerClass}>
                  <span className="min-w-0 truncate">{ISSUE_PRIORITY_LABELS[priority]}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                  <IssuePickerPanel
                    searchPlaceholder="Change priority…"
                    commandShortcut="P"
                    items={priorityItems}
                    value={priority}
                    onSelect={(value) => {
                      if (!isIssuePriority(value)) return;
                      onPatch({ metadata: { priority: value } });
                      setPriorityOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </PropertyRow>
        </div>

        <CollapsibleSection
          title="Session environment"
          trailing={
            <SessionIcons os={detail.os} browser={detail.browser} device={detail.device} />
          }
        >
          <dl className="space-y-2 text-sm text-[#5f6368]">
            <div className="flex justify-between gap-2">
              <dt>OS</dt>
              <dd className="font-medium text-foreground">{detail.os ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Browser</dt>
              <dd className="font-medium text-foreground">{detail.browser ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Device</dt>
              <dd className="font-medium text-foreground">{detail.device ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Captured</dt>
              <dd className="font-medium text-foreground">
                {format(new Date(detail.createdAt), "MMM d, h:mm a")}
              </dd>
            </div>
          </dl>
        </CollapsibleSection>
      </div>
    </aside>
  );
}
