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
    <div className="divide-y divide-sidebar-border">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex gap-3 py-3">
          <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-muted/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({
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
      <div className="flex cursor-pointer gap-3 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-violet-600">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 text-[13px] leading-5 text-muted-foreground">
          <p>
            Title generated from issue <span className="font-medium text-foreground">description</span>{" "}
            using AI
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(entry.at)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex cursor-pointer gap-3 py-3">
      <IssueUserAvatar name={actor} className="h-6 w-6 shrink-0 text-[9px]" />
      <div className="min-w-0 flex-1 text-[13px] leading-5 text-muted-foreground">
        {entry.kind === "reported" && entry.issueType ? (
          <ReportedLine issueType={entry.issueType} you={you} actor={actor} at={entry.at} />
        ) : null}
        {entry.kind === "status" && entry.toStatus ? (
          <StatusLine you={you} actor={actor} toStatus={entry.toStatus} at={entry.at} />
        ) : null}
        {entry.kind === "priority" && entry.toPriority ? (
          <PriorityLine
            you={you}
            actor={actor}
            fromPriority={entry.fromPriority}
            toPriority={entry.toPriority}
            at={entry.at}
          />
        ) : null}
        {entry.kind === "assignment" ? (
          <AssignmentLine
            you={you}
            actor={actor}
            assigneeNames={entry.toAssigneeNames ?? []}
            at={entry.at}
          />
        ) : null}
      </div>
    </div>
  );
}

function ReportedLine({
  issueType,
  you,
  actor,
  at,
}: {
  issueType: IssueType;
  you: boolean;
  actor: string;
  at: string;
}) {
  return (
    <>
      <p>
        <span className="font-medium text-foreground">{you ? "You" : actor}</span> reported this{" "}
        <span className="font-medium text-foreground">{ISSUE_TYPE_LABELS[issueType]}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(at)}</p>
    </>
  );
}

function StatusLine({
  you,
  actor,
  toStatus,
  at,
}: {
  you: boolean;
  actor: string;
  toStatus: import("@/types").ReportStatus;
  at: string;
}) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-1">
        <span className="font-medium text-foreground">{you ? "You" : actor}</span>
        updated the <span className="font-medium text-foreground">status</span> to
        <IssueStatusInline status={toStatus} />
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(at)}</p>
    </>
  );
}

function PriorityLine({
  you,
  actor,
  fromPriority,
  toPriority,
  at,
}: {
  you: boolean;
  actor: string;
  fromPriority?: IssuePriority;
  toPriority: IssuePriority;
  at: string;
}) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-foreground">{you ? "You" : actor}</span>
        updated the <span className="font-medium text-foreground">priority</span>
        <span className="text-muted-foreground">{relativeTime(at)}.</span>
        {fromPriority ? (
          <>
            <PriorityPill priority={fromPriority} />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </>
        ) : null}
        <PriorityPill priority={toPriority} />
      </p>
    </>
  );
}

function AssignmentLine({
  you,
  actor,
  assigneeNames,
  at,
}: {
  you: boolean;
  actor: string;
  assigneeNames: string[];
  at: string;
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
    <>
      <p>
        <span className="font-medium text-foreground">{you ? "You" : actor}</span> {target}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(at)}</p>
    </>
  );
}
