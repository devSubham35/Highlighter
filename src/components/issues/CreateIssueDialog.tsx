"use client";

import { IssuePickerPanel } from "@/components/issues/IssuePickerPanel";
import { IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { IssuePriority, IssueType, WorkspaceMember } from "@/types";
import type { IssueItem } from "@/components/projects/ProjectDetailsView";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";

export function CreateIssueDialog({
  projectId,
  defaultPageUrl,
  members,
  currentUserId,
  onCreated,
  open: controlledOpen,
  onOpenChange,
}: {
  projectId: string;
  defaultPageUrl: string | null;
  members: WorkspaceMember[];
  currentUserId: string;
  onCreated: (issue: IssueItem) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState(defaultPageUrl ?? "");
  const [type, setType] = useState<IssueType>("BUG");
  const [priority, setPriority] = useState<IssuePriority>("NONE");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

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

  const assigneeLabel =
    assigneeIds.length === 0
      ? "No assignee"
      : assigneeIds.length === 1
        ? assigneeItems.find((item) => item.value === assigneeIds[0])?.label ?? "1 assignee"
        : `${assigneeIds.length} assignees`;
  const selectedAssignees = members.filter((member) => assigneeIds.includes(member.id));
  const primaryAssignee = selectedAssignees[0];

  function resetForm() {
    setTitle("");
    setDescription("");
    setPageUrl(defaultPageUrl ?? "");
    setType("BUG");
    setPriority("NONE");
    setAssigneeIds([]);
    setTypeOpen(false);
    setPriorityOpen(false);
    setAssigneeOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !pageUrl.trim() || submitting) return;

    setSubmitting(true);
    const response = await fetch(`/api/projects/${projectId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description.trim() ? description : null,
        pageUrl,
        type,
        priority,
        assigneeIds,
      }),
    });
    setSubmitting(false);

    if (!response.ok) {
      toast.error("Issue creation failed", "Could not create the issue.");
      return;
    }

    const issue = (await response.json()) as IssueItem;
    onCreated(issue);
    toast.success("Issue created");
    handleOpenChange(false);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" size="sm" onClick={() => handleOpenChange(true)}>
        <Plus className="h-4 w-4" />
        Create issue
      </Button>
      <DialogContent showCloseButton className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create issue</DialogTitle>
            <DialogDescription>Add an issue manually for this project.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <label className="block space-y-2">
              <span className="block text-sm font-medium text-foreground">Title</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Issue title"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="block text-sm font-medium text-foreground">Page URL</span>
              <Input
                value={pageUrl}
                onChange={(event) => setPageUrl(event.target.value)}
                placeholder="https://example.com/page"
                type="url"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="block text-sm font-medium text-foreground">Description</span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What needs to be fixed?"
                className="h-24 resize-none"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <FieldPicker label="Type">
                <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                  <PopoverTrigger className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-left text-sm font-medium">
                    {issueTypeIcon(type)}
                    <span className="min-w-0 flex-1 truncate">{ISSUE_TYPE_LABELS[type]}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                    <IssuePickerPanel
                      searchPlaceholder="Change type..."
                      items={ISSUE_TYPE_OPTIONS}
                      value={type}
                      onSelect={(value) => {
                        if (!isIssueType(value)) return;
                        setType(value);
                        setTypeOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FieldPicker>

              <FieldPicker label="Priority">
                <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                  <PopoverTrigger className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-left text-sm font-medium">
                    {issuePriorityIcon(priority)}
                    <span className="min-w-0 flex-1 truncate">{ISSUE_PRIORITY_LABELS[priority]}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                    <IssuePickerPanel
                      searchPlaceholder="Change priority..."
                      items={ISSUE_PRIORITY_OPTIONS}
                      value={priority}
                      onSelect={(value) => {
                        if (!isIssuePriority(value)) return;
                        setPriority(value);
                        setPriorityOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FieldPicker>

              <FieldPicker label="Assignee">
                <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                  <PopoverTrigger
                    aria-label={primaryAssignee ? `Change assignee: ${assigneeLabel}` : "Assign issue"}
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-card text-left text-sm font-medium transition-colors hover:bg-muted/50",
                      primaryAssignee ? "w-fit px-1.5 pr-2" : "w-full px-3",
                    )}
                  >
                    {primaryAssignee ? (
                      <>
                        <IssueUserAvatar
                          name={primaryAssignee.name || primaryAssignee.email}
                          image={primaryAssignee.image}
                          className="size-7"
                        />
                        {selectedAssignees.length > 1 ? (
                          <span className="text-xs text-muted-foreground">+{selectedAssignees.length - 1}</span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {issueUnassignedIcon()}
                        <span className="min-w-0 flex-1 truncate">{assigneeLabel}</span>
                      </>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
                    <IssuePickerPanel
                      searchPlaceholder="Assign to..."
                      items={assigneeItems}
                      values={assigneeIds}
                      multiple
                      onValuesChange={setAssigneeIds}
                    />
                  </PopoverContent>
                </Popover>
              </FieldPicker>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim() || !pageUrl.trim()}>
              <Plus className="h-4 w-4" />
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldPicker({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}
