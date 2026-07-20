"use client";

import { IssuePickerPanel } from "@/components/issues/IssuePickerPanel";
import { IssueAvatarGroup, IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import { formatIssueReportedAt } from "@/lib/issue-format";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_OPTIONS,
  issuePriorityIcon,
  issueTypeIcon,
  issueUnassignedIcon,
  isIssuePriority,
  isIssueType,
} from "@/lib/issue-options";
import { memberDisplayName } from "@/lib/member-display";
import { formatIssueKey, parseReportMetadata } from "@/lib/report-metadata";
import type { IssueItem } from "@/components/projects/ProjectDetailsView";
import type { IssuePriority, IssueType, WorkspaceMember } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
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
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted" title={os ?? "OS"}>
        <Laptop className="h-3.5 w-3.5" />
      </span>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted" title={browser ?? "Browser"}>
        <Globe className="h-3.5 w-3.5" />
      </span>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md bg-muted"
        title={device ?? "Device"}
      >
        {isMobile ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
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
    <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card dark:bg-surface-elevated">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
      >
        <span>{title}</span>
        <span className="flex items-center gap-2">
          {!open ? trailing : null}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </span>
      </button>
      {open ? <div className="border-t border-sidebar-border px-3.5 py-3">{children}</div> : null}
    </div>
  );
}

const PROPERTY_ICON_SLOT = "flex size-6 shrink-0 items-center justify-center";

function PropertyRow({
  label,
  children,
  interactive = false,
  onOpen,
}: {
  label: string;
  children: React.ReactNode;
  interactive?: boolean;
  onOpen?: () => void;
}) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-center gap-3 text-[12px] leading-5">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? onOpen : undefined}
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen?.();
                }
              }
            : undefined
        }
        className={cn(
          "group/property flex min-h-8 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium leading-5 text-foreground outline-none",
          interactive &&
            "cursor-pointer border border-transparent bg-muted/45 pr-1.5 text-foreground transition-colors hover:border-border hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 dark:bg-white/5 dark:hover:bg-white/10",
        )}
      >
        {children}
        {interactive ? (
          <ChevronRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70 transition-transform group-hover/property:translate-x-0.5 group-hover/property:opacity-100" />
        ) : null}
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
  currentUserId,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onPatch,
}: {
  detail: IssueItem;
  projectName: string;
  members: WorkspaceMember[];
  reporterName: string;
  reporterImage?: string | null;
  currentIndex: number;
  currentUserId: string;
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
      })),
    [],
  );

  const assigneeItems = useMemo(
    () =>
      members.map((member) => ({
        value: member.id,
        label: memberDisplayName(member, currentUserId),
        avatarName: member.name || member.email,
        avatarImage: member.image,
      })),
    [currentUserId, members],
  );

  const pickerTriggerClass =
    "inline-flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none";

  return (
    <aside className="sticky top-0 flex h-full w-[min(340px,32vw)] min-w-[280px] shrink-0 flex-col border-l border-sidebar-border bg-muted/30 dark:bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-sidebar-border bg-card/80 px-4 py-3 backdrop-blur-sm dark:bg-surface-elevated">
        <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={currentIndex <= 0}
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-xs font-medium tabular-nums text-foreground">
            {currentIndex + 1} of {totalCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={currentIndex >= totalCount - 1}
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="rounded-xl border border-sidebar-border bg-card p-3.5 dark:bg-surface-elevated">
          <div className="flex items-start gap-3">
            <IssueUserAvatar
              name={reporterName}
              image={reporterImage}
              className="size-9"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Reported by <span className="font-semibold">{reporterName}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatIssueReportedAt(detail.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl border border-sidebar-border bg-card px-3.5 py-3 dark:bg-surface-elevated">
          <PropertyRow label="ID">
            <span className={PROPERTY_ICON_SLOT}>
              <span className="text-sm font-semibold text-primary">#</span>
            </span>
            <span className="min-w-0 truncate text-[12px] font-medium leading-5">{issueKey}</span>
          </PropertyRow>
          <PropertyRow label="Type" interactive onOpen={() => setTypeOpen(true)}>
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
          <PropertyRow label="Assignee" interactive onOpen={() => setAssigneeOpen(true)}>
            <div className="min-w-0 flex-1">
              <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                <PopoverTrigger
                  aria-label={primaryAssignee ? "Change assignee" : "Assign issue"}
                  className={cn(
                    primaryAssignee
                      ? "inline-flex cursor-pointer items-center gap-1.5 rounded-full outline-none"
                      : pickerTriggerClass,
                  )}
                >
                  {primaryAssignee ? (
                    <IssueAvatarGroup members={assignees} size="sm" />
                  ) : (
                    <>
                      <span className={PROPERTY_ICON_SLOT}>{issueUnassignedIcon()}</span>
                      <span className="min-w-0 truncate text-muted-foreground">No assignee</span>
                    </>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                  <IssuePickerPanel
                    searchPlaceholder="Assign to…"
                    items={assigneeItems}
                    values={assigneeIds}
                    multiple
                    onValuesChange={(ids) => onPatch({ metadata: { assigneeIds: ids } })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </PropertyRow>
          <PropertyRow label="Priority" interactive onOpen={() => setPriorityOpen(true)}>
            <span className={PROPERTY_ICON_SLOT}>{issuePriorityIcon(priority)}</span>
            <div className="min-w-0 flex-1">
              <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                <PopoverTrigger className={pickerTriggerClass}>
                  <span className="min-w-0 truncate">{ISSUE_PRIORITY_LABELS[priority]}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                  <IssuePickerPanel
                    searchPlaceholder="Change priority…"
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
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">OS</dt>
              <dd className="font-medium text-foreground">{detail.os ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Browser</dt>
              <dd className="font-medium text-foreground">{detail.browser ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Device</dt>
              <dd className="font-medium text-foreground">{detail.device ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Captured</dt>
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
