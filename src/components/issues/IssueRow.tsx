"use client";

import {
  IssueAssignPicker,
  IssuePriorityPicker,
  IssueTypePicker,
} from "@/components/issues/IssuePickerButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatIssueKey, parseReportMetadata } from "@/lib/report-metadata";
import { formatIssueCreatedAt } from "@/lib/issue-format";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_STATUS_OPTION_CLASS,
  ISSUE_STATUS_TRIGGER_CLASS,
  issuePriorityIcon,
  issueTypeIcon,
  isIssuePriority,
  isIssueType,
} from "@/lib/issue-options";
import { REPORT_STATUS_OPTIONS, isReportStatus } from "@/lib/report-options";
import { toast } from "@/lib/toast";
import type { IssueItem } from "@/components/projects/ProjectDetailsView";
import type { ComboboxOption } from "@/components/ui/combobox";
import type { IssuePriority, IssueType, WorkspaceMember, ReportStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Copy, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function IssueRow({
  issue,
  projectName,
  members,
  onOpen,
  onUpdated,
  onDeleted,
}: {
  issue: IssueItem;
  projectName: string;
  members: WorkspaceMember[];
  onOpen: () => void;
  onUpdated: (issue: IssueItem) => void;
  onDeleted: (issueId: string) => void;
}) {
  const router = useRouter();
  const metadata = parseReportMetadata(issue.metadata);
  const issueType: IssueType = metadata.type ?? "IMPROVEMENT";
  const priority: IssuePriority = metadata.priority ?? "NONE";
  const assigneeIds = metadata.assigneeIds ?? [];
  const issueKey = formatIssueKey(projectName, metadata.issueNumber ?? 1);
  const reporterName = metadata.reporterName ?? "Anonymous";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function patchIssue(patch: {
    status?: ReportStatus;
    metadata?: Record<string, unknown>;
  }) {
    const response = await fetch(`/api/reports/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      toast.error("Issue update failed", "Could not save the issue change.");
      return;
    }
    const updated = (await response.json()) as IssueItem;
    onUpdated(updated);
    toast.success("Issue updated");
    router.refresh();
  }

  async function deleteIssue() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/reports/${issue.id}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      const message = "Could not delete issue.";
      setError(message);
      toast.error("Issue deletion failed", message);
      return;
    }
    setDeleteOpen(false);
    onDeleted(issue.id);
    toast.success("Issue deleted", `"${issue.title}" was removed.`);
    router.refresh();
  }

  function copyLink() {
    const url = `${window.location.origin}/projects/${issue.projectId}?issue=${issue.id}`;
    void navigator.clipboard.writeText(url);
    toast.success("Issue link copied");
  }

  const statusLabel =
    REPORT_STATUS_OPTIONS.find((option) => option.value === issue.status)?.label ?? "Open";

  return (
    <>
      <article
        onClick={onOpen}
        className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 shadow-[var(--shadow-surface)] transition-[background-color,box-shadow] duration-200 hover:bg-muted/40 dark:hover:bg-secondary/40"
      >
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-sidebar-border bg-muted">
          {issue.screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={issue.screenshotUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              N/A
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <IssueTypePicker
              issueType={issueType}
              icon={issueTypeIcon(issueType)}
              onTypeChange={(value) => {
                if (!isIssueType(value)) return;
                patchIssue({ metadata: { type: value } });
              }}
            />

            <IssueAssignPicker
              assigneeIds={assigneeIds}
              members={members}
              onAssigneeIdsChange={(ids) => patchIssue({ metadata: { assigneeIds: ids } })}
            />

            <IssuePriorityPicker
              priority={priority}
              icon={issuePriorityIcon(priority)}
              onPriorityChange={(value) => patchIssue({ metadata: { priority: value } })}
            />
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              <span className="text-muted-foreground">#{issueKey}</span> {issue.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">{reporterName}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3" onClick={(event) => event.stopPropagation()}>
          <span className="hidden text-xs text-muted-foreground md:inline">
            {formatIssueCreatedAt(issue.createdAt)}
          </span>
          <div className="hidden sm:block">
            <Combobox
              value={issue.status}
              onValueChange={(value) => {
                if (!isReportStatus(value)) return;
                patchIssue({ status: value });
              }}
              options={REPORT_STATUS_OPTIONS}
              searchable={false}
              aria-label="Issue status"
              popoverClassName="min-w-[9.5rem]"
              className={cn(
                "h-8 w-fit min-w-0 gap-1.5 rounded-lg border px-2.5 text-xs font-medium",
                ISSUE_STATUS_TRIGGER_CLASS[issue.status],
              )}
              optionClassName={(option, selected) =>
                selected && isReportStatus(option.value)
                  ? ISSUE_STATUS_OPTION_CLASS[option.value]
                  : undefined
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-secondary hover:text-foreground dark:hover:bg-secondary/90"
            aria-label="Copy issue link"
            onClick={copyLink}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-secondary hover:text-foreground dark:hover:bg-secondary/90"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="gap-2 text-destructive data-highlighted:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-xs text-muted-foreground sm:hidden">{statusLabel}</span>
        </div>
      </article>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete issue?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{issue.title}</span>.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="px-6 text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={deleteIssue} disabled={loading}>
              {loading ? "Deleting..." : "Delete issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function memberComboboxOptions(members: WorkspaceMember[]): ComboboxOption[] {
  return members.map((member) => ({
    value: member.id,
    label: member.name || member.email,
  }));
}
