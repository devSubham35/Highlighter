"use client";

import { IssueStatusInline } from "@/components/issues/IssueStatusBadge";
import { IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import type { ActivityEntry } from "@/lib/report-metadata";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_TYPE_LABELS,
  issuePriorityIcon,
} from "@/lib/issue-options";
import type { IssuePriority, IssueType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Sparkles } from "lucide-react";

function relativeTime(at: string) {
  return formatDistanceToNow(new Date(at), { addSuffix: true }).replace(/^about /, "");
}

function PriorityPill({ priority }: { priority: IssuePriority }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium text-foreground">
      {issuePriorityIcon(priority)}
      {ISSUE_PRIORITY_LABELS[priority]}
    </span>
  );
}

export function IssueActivityTimeline({
  entries,
  currentUserName,
  reporterName,
}: {
  entries: ActivityEntry[];
  currentUserName: string;
  reporterName: string;
}) {
  return (
    <div className="divide-y divide-sidebar-border">
      {entries.map((entry) => (
        <ActivityRow
          key={entry.id}
          entry={entry}
          currentUserName={currentUserName}
          reporterName={reporterName}
        />
      ))}
    </div>
  );
}

export function IssueActivityTimelineSkeleton() {
  return (
    <div className="space-y-1.5">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex gap-3 px-5 py-2.5">
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityRow({
  entry,
  currentUserName,
  reporterName,
}: {
  entry: ActivityEntry;
  currentUserName: string;
  reporterName: string;
}) {
  const actor = entry.actorName ?? currentUserName;
  const you = actor === currentUserName || actor === reporterName;

  if (entry.kind === "title_ai") {
    return (
      <div className="flex cursor-pointer gap-3 px-5 py-2.5 transition-colors hover:bg-muted/60 dark:hover:bg-muted/25">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 text-[13px] leading-5 text-muted-foreground">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">Highlighter</span>
            <span className="text-[12px] font-medium text-muted-foreground">{relativeTime(entry.at)}</span>
          </p>
          <p className="mt-1 text-[13px] font-medium leading-5 text-foreground">
            Generated title from issue description using AI
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex cursor-pointer gap-3 px-5 py-2.5 transition-colors hover:bg-muted/60 dark:hover:bg-muted/25">
      <IssueUserAvatar name={actor} className="h-7 w-7 shrink-0 text-[10px]" />
      <div className="min-w-0 flex-1 text-[13px] leading-5 text-muted-foreground">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{you ? "You" : actor}</span>
          <span className="text-[12px] font-medium text-muted-foreground">{relativeTime(entry.at)}</span>
        </p>
        {entry.kind === "reported" && entry.issueType ? (
          <ReportedLine issueType={entry.issueType} />
        ) : null}
        {entry.kind === "status" && entry.toStatus ? (
          <StatusLine toStatus={entry.toStatus} />
        ) : null}
        {entry.kind === "priority" && entry.toPriority ? (
          <PriorityLine
            fromPriority={entry.fromPriority}
            toPriority={entry.toPriority}
          />
        ) : null}
        {entry.kind === "type" && entry.toIssueType ? (
          <TypeLine fromIssueType={entry.fromIssueType} toIssueType={entry.toIssueType} />
        ) : null}
        {entry.kind === "assignment" ? (
          <AssignmentLine
            assigneeNames={entry.toAssigneeNames ?? []}
          />
        ) : null}
      </div>
    </div>
  );
}

function ReportedLine({
  issueType,
}: {
  issueType: IssueType;
}) {
  return (
    <p className="mt-1 text-[13px] font-medium leading-5 text-foreground">
      Reported this {ISSUE_TYPE_LABELS[issueType]}
    </p>
  );
}

function TypeLine({
  fromIssueType,
  toIssueType,
}: {
  fromIssueType?: IssueType;
  toIssueType: IssueType;
}) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-medium leading-5 text-foreground">
      Updated the type
      {fromIssueType ? (
        <>
          <span>{ISSUE_TYPE_LABELS[fromIssueType]}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </>
      ) : null}
      <span>{ISSUE_TYPE_LABELS[toIssueType]}</span>
    </p>
  );
}

function StatusLine({
  toStatus,
}: {
  toStatus: import("@/types").ReportStatus;
}) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1 text-[13px] font-medium leading-5 text-foreground">
      Updated the status to <IssueStatusInline status={toStatus} />
    </p>
  );
}

function PriorityLine({
  fromPriority,
  toPriority,
}: {
  fromPriority?: IssuePriority;
  toPriority: IssuePriority;
}) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-medium leading-5 text-foreground">
      Updated the priority
      {fromPriority ? (
        <>
          <PriorityPill priority={fromPriority} />
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </>
      ) : null}
      <PriorityPill priority={toPriority} />
    </p>
  );
}

function AssignmentLine({
  assigneeNames,
}: {
  assigneeNames: string[];
}) {
  const target =
    assigneeNames.length === 0
      ? "unassigned this issue"
      : assigneeNames.length === 1
        ? `assigned this issue to ${assigneeNames[0]}`
        : `assigned this issue to ${assigneeNames.slice(0, -1).join(", ")} and ${
            assigneeNames[assigneeNames.length - 1]
          }`;

  return (
    <p className="mt-1 text-[13px] font-medium leading-5 text-foreground">
      {target[0]?.toUpperCase()}{target.slice(1)}
    </p>
  );
}
