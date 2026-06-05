"use client";

import { IssueActivityTimeline } from "@/components/issues/IssueActivityTimeline";
import { IssueCommentComposer } from "@/components/issues/IssueCommentComposer";
import { IssueCommentsList, type IssueComment } from "@/components/issues/IssueCommentsList";
import { IssueDescriptionEditor } from "@/components/issues/IssueDescriptionEditor";
import { IssueDetailSidebar } from "@/components/issues/IssueDetailSidebar";
import { IssueScreenshotPreview } from "@/components/issues/IssueScreenshotPreview";
import { IssueStatusBadge } from "@/components/issues/IssueStatusBadge";
import type { IssueItem } from "@/components/projects/ProjectDetailsView";
import {
  appendActivityLog,
  buildDefaultActivityLog,
  parseReportMetadata,
} from "@/lib/report-metadata";
import type { ActivityEntry } from "@/lib/report-metadata";
import type { IssuePriority, IssueType, OrgMember, ReportStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { isIssuePriority } from "@/lib/issue-options";
import { isReportStatus } from "@/lib/report-options";
import { ExternalLink, Link2, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; email: string; image?: string | null };
};

export function IssueDetailModal({
  open,
  onOpenChange,
  issue,
  issues,
  projectName,
  members,
  currentUserName,
  onNavigate,
  onUpdated,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: IssueItem | null;
  issues: IssueItem[];
  projectName: string;
  members: OrgMember[];
  currentUserName: string;
  onNavigate: (issueId: string) => void;
  onUpdated: (issue: IssueItem) => void;
  onDelete?: (issueId: string) => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [detail, setDetail] = useState<IssueItem | null>(issue);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(false);

  const currentIndex = useMemo(
    () => (issue ? issues.findIndex((item) => item.id === issue.id) : -1),
    [issue, issues],
  );

  const loadIssue = useCallback(async (issueId: string, seed?: IssueItem) => {
    setLoading(true);
    const response = await fetch(`/api/reports/${issueId}`);
    setLoading(false);
    if (!response.ok) return;
    const data = (await response.json()) as IssueItem & { comments?: Comment[] };
    const base = seed ?? data;
    const metadata = parseReportMetadata(data.metadata ?? base.metadata);
    const issueType: IssueType = metadata.type ?? "IMPROVEMENT";
    const priority: IssuePriority = metadata.priority ?? "NONE";
    const reporterName = metadata.reporterName ?? currentUserName;

    const activityLog = buildDefaultActivityLog({
      createdAt: data.createdAt,
      issueType,
      status: data.status,
      priority,
      reporterName,
      title: data.title,
      existing: metadata.activityLog,
    }).filter((entry) => entry.kind !== "comment");

    setDetail({ ...base, ...data });
    setActivity(activityLog);
    setComments(
      (data.comments ?? []).map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.createdAt),
        author: comment.author,
      })),
    );
  }, [currentUserName]);

  useEffect(() => {
    if (!open || !issue) {
      if (!open) {
        setDetail(null);
        setComments([]);
        setActivity([]);
      }
      return;
    }
    setDetail(issue);
    void loadIssue(issue.id, issue);
  }, [open, issue, loadIssue]);

  async function patchIssue(
    patch: { status?: ReportStatus; description?: string | null; metadata?: Record<string, unknown> },
    activityEntry?: Omit<ActivityEntry, "id" | "at">,
  ) {
    if (!detail) return;

    let metadata = parseReportMetadata(detail.metadata);
    if (patch.metadata) {
      metadata = { ...metadata, ...patch.metadata };
    }
    if (activityEntry) {
      metadata = appendActivityLog(metadata, {
        ...activityEntry,
        actorName: activityEntry.actorName ?? currentUserName,
      });
    }

    const response = await fetch(`/api/reports/${detail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        metadata,
      }),
    });
    if (!response.ok) return;

    const updated = (await response.json()) as IssueItem;
    setDetail(updated);
    onUpdated(updated);
    await loadIssue(updated.id, updated);
    router.refresh();
  }

  async function handleStatusChange(nextStatus: ReportStatus) {
    if (!detail || nextStatus === detail.status) return;
    await patchIssue(
      { status: nextStatus },
      {
        kind: "status",
        fromStatus: detail.status,
        toStatus: nextStatus,
      },
    );
  }

  async function saveDescription(description: string | null) {
    await patchIssue({ description });
  }

  async function postComment(content: string) {
    if (!detail) return;
    const response = await fetch(`/api/reports/${detail.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) return;
    await loadIssue(detail.id);
    router.refresh();
  }

  function handleMetadataPatch(patch: { metadata?: Record<string, unknown> }) {
    const previous = parseReportMetadata(detail?.metadata);
    const nextPriority = patch.metadata?.priority;
    if (
      nextPriority &&
      isIssuePriority(String(nextPriority)) &&
      nextPriority !== (previous.priority ?? "NONE")
    ) {
      const priority = nextPriority as IssuePriority;
      void patchIssue(
        { metadata: patch.metadata },
        {
          kind: "priority",
          fromPriority: previous.priority ?? "NONE",
          toPriority: priority,
        },
      );
      return;
    }
    void patchIssue(patch);
  }

  if (!open || !issue) return null;

  const displayDetail = detail ?? issue;
  const metadata = parseReportMetadata(displayDetail.metadata);
  const reporterName = metadata.reporterName ?? currentUserName;
  const reporterMember = members.find((member) => member.id === metadata.reporterId);
  const reporterImage = reporterMember?.image ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(94vh,920px)] w-[min(96vw,1080px)] max-w-none flex-col overflow-hidden rounded-xl border-sidebar-border bg-card p-0 shadow-2xl"
      >
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col bg-muted/40">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <IssueScreenshotPreview screenshotUrl={displayDetail.screenshotUrl} title={displayDetail.title} />

              <section className="border-b border-sidebar-border bg-card px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
                      <h2 className="truncate text-lg font-semibold text-foreground">{displayDetail.title}</h2>
                    </div>
                    <a
                      href={displayDetail.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-info hover:underline"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{displayDetail.pageUrl}</span>
                    </a>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <IssueStatusBadge status={displayDetail.status} onStatusChange={handleStatusChange} />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => window.open(displayDetail.pageUrl, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open page URL
                        </DropdownMenuItem>
                        {onDelete ? (
                          <DropdownMenuItem
                            className="gap-2 text-destructive data-highlighted:text-destructive"
                            onClick={() => onDelete(displayDetail.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete issue
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </section>

              <IssueDescriptionEditor description={displayDetail.description} onSave={saveDescription} />

              <section className="bg-card">
                <div className="flex gap-6 border-b border-sidebar-border px-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("comments")}
                    className={cn(
                      "border-b-2 py-3 text-sm font-medium transition-colors",
                      activeTab === "comments"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Comments{comments.length > 0 ? ` ${comments.length}` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={cn(
                      "border-b-2 py-3 text-sm font-medium transition-colors",
                      activeTab === "history"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    History
                  </button>
                </div>

                <div className="px-5">
                  {loading ? (
                    <p className="py-8 text-sm text-muted-foreground">Loading…</p>
                  ) : activeTab === "comments" ? (
                    <IssueCommentsList comments={comments} />
                  ) : (
                    <IssueActivityTimeline
                      entries={activity}
                      currentUserName={currentUserName}
                      reporterName={reporterName}
                    />
                  )}
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t border-sidebar-border bg-muted/40 px-5 py-4">
              <IssueCommentComposer onSubmit={postComment} disabled={loading} />
            </div>
          </div>

          <IssueDetailSidebar
            detail={displayDetail}
            projectName={projectName}
            members={members}
            reporterName={reporterName}
            reporterImage={reporterImage}
            currentIndex={currentIndex}
            totalCount={issues.length}
            onClose={() => onOpenChange(false)}
            onPrev={() => {
              const prev = issues[currentIndex - 1];
              if (prev) onNavigate(prev.id);
            }}
            onNext={() => {
              const next = issues[currentIndex + 1];
              if (next) onNavigate(next.id);
            }}
            onPatch={handleMetadataPatch}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
