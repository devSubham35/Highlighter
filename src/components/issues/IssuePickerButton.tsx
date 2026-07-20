"use client";

import { IssuePickerPanel } from "@/components/issues/IssuePickerPanel";
import { IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_OPTIONS,
  issueUnassignedIcon,
  isIssuePriority,
  isIssueType,
} from "@/lib/issue-options";
import type { IssuePriority, IssueType } from "@/types";
import type { WorkspaceMember } from "@/types";
import { memberDisplayName } from "@/lib/member-display";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

const ROW_ICON_BUTTON =
  "size-9 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:hover:bg-secondary/90";

export function IssueAssignPicker({
  assigneeIds,
  members,
  currentUserId,
  onAssigneeIdsChange,
}: {
  assigneeIds: string[];
  members: WorkspaceMember[];
  currentUserId: string;
  onAssigneeIdsChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const assignees = members.filter((member) => assigneeIds.includes(member.id));
  const primaryAssignee = assignees[0];

  const tooltipLabel =
    assignees.length === 0
      ? "No assignee — click to assign"
      : assignees.length === 1
        ? `${primaryAssignee.name || primaryAssignee.email} — click to change`
        : `${assignees.length} assignees — click to change`;

  const items = useMemo(
    () =>
      members.map((member) => ({
        value: member.id,
        label: memberDisplayName(member, currentUserId),
        avatarName: member.name || member.email,
        avatarImage: member.image,
      })),
    [currentUserId, members],
  );

  return (
    <Tooltip>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={ROW_ICON_BUTTON}
                  aria-label={tooltipLabel}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              {primaryAssignee ? (
                <IssueUserAvatar
                  name={primaryAssignee.name || primaryAssignee.email}
                  image={primaryAssignee.image}
                  className="size-8"
                />
              ) : (
                issueUnassignedIcon("lg")
              )}
            </PopoverTrigger>
          }
        />
        <PopoverContent
          className="w-auto border-0 bg-transparent p-0 shadow-none"
          align="start"
          onClick={(event) => event.stopPropagation()}
        >
          <IssuePickerPanel
            searchPlaceholder="Assign to…"
            items={items}
            values={assigneeIds}
            multiple
            onValuesChange={(ids) => {
              onAssigneeIdsChange(ids);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

export function IssueTypePicker({
  issueType,
  icon,
  onTypeChange,
}: {
  issueType: IssueType;
  icon: React.ReactNode;
  onTypeChange: (value: IssueType) => void;
}) {
  const [open, setOpen] = useState(false);
  const tooltipLabel = `${ISSUE_TYPE_LABELS[issueType]} — click to change`;

  const items = useMemo(
    () =>
      ISSUE_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        icon: option.icon,
      })),
    [],
  );

  return (
    <Tooltip>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={ROW_ICON_BUTTON}
                  aria-label={tooltipLabel}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <span className="flex size-6 items-center justify-center [&_svg]:size-6">{icon}</span>
            </PopoverTrigger>
          }
        />
        <PopoverContent
          className="w-auto border-0 bg-transparent p-0 shadow-none"
          align="start"
          onClick={(event) => event.stopPropagation()}
        >
          <IssuePickerPanel
            searchPlaceholder="Change type…"
            items={items}
            value={issueType}
            onSelect={(value) => {
              if (!isIssueType(value)) return;
              onTypeChange(value);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

export function IssuePriorityPicker({
  priority,
  icon,
  onPriorityChange,
}: {
  priority: IssuePriority;
  icon: React.ReactNode;
  onPriorityChange: (value: IssuePriority) => void;
}) {
  const [open, setOpen] = useState(false);
  const tooltipLabel = `${ISSUE_PRIORITY_LABELS[priority]} — click to change`;

  const items = useMemo(
    () =>
      ISSUE_PRIORITY_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        icon: option.icon,
      })),
    [],
  );

  return (
    <Tooltip>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={ROW_ICON_BUTTON}
                  aria-label={tooltipLabel}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <span className="flex size-6 items-center justify-center [&_svg]:size-6">{icon}</span>
            </PopoverTrigger>
          }
        />
        <PopoverContent
          className="w-auto border-0 bg-transparent p-0 shadow-none"
          align="start"
          onClick={(event) => event.stopPropagation()}
        >
          <IssuePickerPanel
            searchPlaceholder="Change priority…"
            items={items}
            value={priority}
            onSelect={(value) => {
              if (!isIssuePriority(value)) return;
              onPriorityChange(value);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

export function IssueStatusPicker({
  status,
  options,
  onStatusChange,
  label,
  className,
}: {
  status: string;
  options: ComboboxOption[];
  onStatusChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div onClick={(event) => event.stopPropagation()} className="shrink-0">
      <Popover>
        <PopoverTrigger
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:opacity-90",
            className,
          )}
          aria-label="Change status"
        >
          {label}
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <Combobox
            value={status}
            onValueChange={onStatusChange}
            options={options}
            searchable={false}
            aria-label="Issue status"
            className="min-w-0 border-0 shadow-none"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
