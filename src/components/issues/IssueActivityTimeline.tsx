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
    <div className="divide-y divide-[#e8eaed]">
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
      <div className="flex gap-3 py-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-violet-600">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 text-sm leading-relaxed text-[#5f6368]">
          <p>
            Title generated from issue <span className="font-medium text-foreground">description</span>{" "}
            using AI
          </p>
          <p className="mt-0.5 text-xs text-[#80868b]">{relativeTime(entry.at)}</p>
        </div>
      </div>
    );
  }

  if (entry.kind === "comment") return null;

  return (
    <div className="flex gap-3 py-4">
      <IssueUserAvatar name={actor} className="h-7 w-7 shrink-0 text-[10px]" />
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-[#5f6368]">
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
      <p className="mt-0.5 text-xs text-[#80868b]">{relativeTime(at)}</p>
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
      <p className="mt-0.5 text-xs text-[#80868b]">{relativeTime(at)}</p>
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
        <span className="text-[#80868b]">{relativeTime(at)}.</span>
        {fromPriority ? (
          <>
            <PriorityPill priority={fromPriority} />
            <ArrowRight className="h-3.5 w-3.5 text-[#80868b]" />
          </>
        ) : null}
        <PriorityPill priority={toPriority} />
      </p>
    </>
  );
}
