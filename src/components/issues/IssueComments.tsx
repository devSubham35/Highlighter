"use client";

import {
  ActivityRow,
  IssueActivityTimelineSkeleton,
} from "@/components/issues/IssueActivityTimeline";
import { IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { IssueRealtimeComment } from "@/lib/realtime";
import type { ActivityEntry } from "@/lib/report-metadata";
import { toast } from "@/lib/toast";
import { useIssueRealtime } from "@/lib/use-issue-realtime";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ListFilter, Paperclip, Pencil, Search, Send, SmilePlus, Trash2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type IssueComment = IssueRealtimeComment;
type ActivityFilter = "all" | "comments" | "history";
type ActivitySort = "newest" | "oldest";
const ACTIVITY_SORT_STORAGE_KEY = "highlight:issue-activity-sort";
const QUICK_REACTIONS = ["✅", "👀", "🙌", "🙏", "➕", "👏", "💡", "🎯", "👋", "👍", "❤️", "🔥"] as const;
const REACTION_LABELS: Record<string, string> = {
  "✅": "Done",
  "👀": "Looking",
  "🙌": "Celebrate",
  "🙏": "Thanks",
  "➕": "Plus one",
  "👏": "Clap",
  "💡": "Idea",
  "🎯": "Target",
  "👋": "Wave",
  "👍": "Thumbs up",
  "❤️": "Love",
  "🔥": "Fire",
};

function commentTime(at: string) {
  return formatDistanceToNow(new Date(at), { addSuffix: true }).replace(/^about /, "");
}

export function IssueComments({
  issueId,
  projectId,
  currentUserId,
  currentUserName,
  reporterName,
  activityEntries,
  activityLoading,
}: {
  issueId: string;
  projectId: string;
  currentUserId: string;
  currentUserName: string;
  reporterName: string;
  activityEntries: ActivityEntry[];
  activityLoading: boolean;
}) {
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>("comments");
  const [sort, setSort] = useState<ActivitySort>(() => {
    if (typeof window === "undefined") return "newest";
    return window.localStorage.getItem(ACTIVITY_SORT_STORAGE_KEY) === "oldest" ? "oldest" : "newest";
  });
  const [deleteComment, setDeleteComment] = useState<IssueComment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const streamEntries = useMemo(
    () => {
      const entries = [
        ...activityEntries.map((entry) => ({
          type: "activity" as const,
          id: `activity-${entry.id}`,
          at: entry.at,
          entry,
        })),
        ...comments.map((comment) => ({
          type: "comment" as const,
          id: `comment-${comment.id}`,
          at: comment.createdAt,
          comment,
        })),
      ];
      return entries
        .filter((entry) => {
          if (filter === "comments") return entry.type === "comment";
          if (filter === "history") return entry.type === "activity";
          return true;
        })
        .sort((first, second) => {
          const firstTime = new Date(first.at).getTime();
          const secondTime = new Date(second.at).getTime();
          return sort === "newest" ? secondTime - firstTime : firstTime - secondTime;
        });
    },
    [activityEntries, comments, filter, sort],
  );

  useIssueRealtime({
    enabled: Boolean(projectId && issueId),
    projectId,
    issueId,
    onEvent: (event) => {
      if (event.type === "issue.comment_created" && event.comment.reportId === issueId) {
        setComments((current) => {
          if (current.some((comment) => comment.id === event.comment.id)) return current;
          return [...current, event.comment];
        });
        return;
      }
      if (event.type === "issue.comment_updated" && event.comment.reportId === issueId) {
        setComments((current) =>
          current.map((comment) => (comment.id === event.comment.id ? event.comment : comment)),
        );
        return;
      }
      if (event.type === "issue.comment_deleted" && event.issueId === issueId) {
        setComments((current) => current.filter((comment) => comment.id !== event.commentId));
        return;
      }
      if (event.type === "issue.comment_reaction_updated" && event.issueId === issueId) {
        setComments((current) =>
          current.map((comment) =>
              comment.id === event.commentId ? applyReactionUpdate(comment, {
              emoji: event.emoji,
              count: event.count,
              reactedByMe: event.userId === currentUserId ? event.reactedByUser : undefined,
              users: event.users,
            }) : comment,
          ),
        );
      }
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      const response = await fetch(`/api/reports/${issueId}/comments`);
      setLoading(false);
      if (!response.ok || cancelled) return;
      setComments((await response.json()) as IssueComment[]);
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [issueId]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVITY_SORT_STORAGE_KEY, sort);
  }, [sort]);

  useEffect(() => {
    if (sort === "newest") {
      topRef.current?.scrollIntoView({ block: "nearest" });
      return;
    }
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [sort, streamEntries.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody || sending) return;

    setSending(true);
    const response = await fetch(`/api/reports/${issueId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: nextBody }),
    });
    setSending(false);

    if (!response.ok) {
      toast.error("Comment failed", "Could not send your message.");
      return;
    }

    const comment = (await response.json()) as IssueComment;
    setBody("");
    setComments((current) => {
      if (current.some((item) => item.id === comment.id)) return current;
      return [...current, comment];
    });
  }

  async function handleEditComment(commentId: string, nextBody: string) {
    const response = await fetch(`/api/reports/${issueId}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: nextBody }),
    });

    if (!response.ok) {
      toast.error("Comment update failed", "Could not save the comment.");
      return false;
    }

    const updated = (await response.json()) as IssueComment;
    setComments((current) =>
      current.map((comment) => (comment.id === updated.id ? updated : comment)),
    );
    toast.success("Comment updated");
    return true;
  }

  async function handleDeleteComment() {
    if (!deleteComment) return;

    setDeleting(true);
    const response = await fetch(`/api/reports/${issueId}/comments/${deleteComment.id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!response.ok) {
      toast.error("Comment deletion failed", "Could not delete the comment.");
      return;
    }

    setComments((current) => current.filter((comment) => comment.id !== deleteComment.id));
    setDeleteComment(null);
    toast.success("Comment deleted");
  }

  async function handleReactComment(commentId: string, emoji: string) {
    const previousComments = comments;
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId ? optimisticToggleReaction(comment, emoji, currentUserId, currentUserName) : comment,
      ),
    );

    const response = await fetch(`/api/reports/${issueId}/comments/${commentId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });

    if (!response.ok) {
      setComments(previousComments);
      toast.error("Reaction failed", "Could not update your reaction.");
      return;
    }

    const reaction = (await response.json()) as {
      commentId: string;
      emoji: string;
      count: number;
      reactedByMe: boolean;
      users: Array<{ id: string; name: string; email: string }>;
    };
    setComments((current) =>
      current.map((comment) =>
        comment.id === reaction.commentId
          ? applyReactionUpdate(comment, reaction)
          : comment,
      ),
    );
  }

  return (
    <>
      <section className="flex min-h-[430px] flex-1 flex-col bg-card dark:bg-surface-elevated">
        <div className="shrink-0 px-5 pt-3 pb-2">
        <h3 className="text-[13px] font-semibold text-foreground">Activity</h3>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-muted-foreground">Show:</span>
            <ActivityFilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </ActivityFilterButton>
            <ActivityFilterButton active={filter === "comments"} onClick={() => setFilter("comments")}>
              Comments
            </ActivityFilterButton>
            <ActivityFilterButton active={filter === "history"} onClick={() => setFilter("history")}>
              History
            </ActivityFilterButton>
          </div>
          <button
            type="button"
            onClick={() => setSort((current) => (current === "newest" ? "oldest" : "newest"))}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-muted-foreground hover:text-foreground"
          >
            {sort === "newest" ? "Newest first" : "Oldest first"}
            <ListFilter className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="min-h-[260px] flex-1 overflow-y-auto">
        <div ref={topRef} />
        {loading || activityLoading ? (
          <IssueActivityTimelineSkeleton />
        ) : streamEntries.length === 0 ? (
          <p className="mx-5 rounded-md border border-dashed border-sidebar-border px-3 py-4 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "activity" : filter} yet.
          </p>
        ) : (
          <div>
            {streamEntries.map((item) =>
              item.type === "activity" ? (
                <ActivityRow
                  key={item.id}
                  entry={item.entry}
                  currentUserName={currentUserName}
                  reporterName={reporterName}
                />
              ) : (
                <CommentRow
                  key={item.id}
                  comment={item.comment}
                  currentUserId={currentUserId}
                  onEdit={handleEditComment}
                  onDelete={() => setDeleteComment(item.comment)}
                  onReact={handleReactComment}
                />
              ),
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="sticky bottom-0 flex shrink-0 gap-3 border-t border-sidebar-border bg-card px-5 py-3 dark:bg-surface-elevated"
        onSubmit={handleSubmit}
      >
        <IssueUserAvatar name={currentUserName} className="mt-1 h-7 w-7 shrink-0 text-[10px]" />
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-sm border border-sidebar-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-2 py-1.5">
              <span className="px-1 text-[12px] font-semibold text-primary">Add comment</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add a comment"
              className="min-h-12 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-5 shadow-none focus-visible:ring-0"
              rows={2}
              disabled={sending}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div></div>
            <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={!body.trim() || sending}>
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </form>
      </section>

      <Dialog open={Boolean(deleteComment)} onOpenChange={(open) => !open && setDeleteComment(null)}>
        <DialogContent showCloseButton className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete comment?</DialogTitle>
            <DialogDescription>
              This comment will be permanently removed from the issue activity.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteComment(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="text-white hover:text-white"
              disabled={deleting}
              onClick={() => void handleDeleteComment()}
            >
              {deleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActivityFilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-sm px-2 py-1 font-semibold transition-colors",
        active
          ? "bg-primary/10 text-primary hover:bg-primary/15"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function CommentRow({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
}: {
  comment: IssueComment;
  currentUserId: string;
  onEdit: (commentId: string, body: string) => Promise<boolean>;
  onDelete: () => void;
  onReact: (commentId: string, emoji: string) => Promise<void>;
}) {
  const mine = comment.author.id === currentUserId;
  const authorName = comment.author.name || comment.author.email;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setDraft(comment.body);
    });
    return () => {
      cancelled = true;
    };
  }, [comment.body, editing]);

  async function handleSave() {
    const nextBody = draft.trim();
    if (!nextBody || saving) return;
    setSaving(true);
    const saved = await onEdit(comment.id, nextBody);
    setSaving(false);
    if (saved) setEditing(false);
  }

  return (
    <div className="group relative flex gap-3 px-5 py-2.5 pr-16 transition-colors hover:bg-muted/60 dark:hover:bg-muted/25">
      <IssueUserAvatar
        name={authorName}
        image={comment.author.image}
        className="h-7 w-7 shrink-0 text-[10px]"
      />
      <div className="min-w-0 flex-1 text-[13px] leading-5 text-muted-foreground">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{mine ? "You" : authorName}</span>
          <span className="text-[12px] font-medium text-muted-foreground">{commentTime(comment.createdAt)}</span>
        </p>
        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-20 resize-none text-sm"
              disabled={saving}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={!draft.trim() || saving}
                onClick={() => void handleSave()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8"
                disabled={saving}
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-[13px] font-medium leading-5 text-foreground">
            {comment.body}
          </p>
        )}
        {comment.reactions.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {comment.reactions.map((reaction) => (
              <Tooltip key={reaction.emoji}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-pressed={reaction.reactedByMe}
                      onClick={() => void onReact(comment.id, reaction.emoji)}
                      className={cn(
                        "inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2 text-[12px] font-semibold transition-[background-color,border-color,box-shadow] hover:border-primary/30 hover:shadow-sm",
                        reaction.reactedByMe
                          ? "border-primary/35 bg-primary/10 text-primary"
                          : "border-sidebar-border bg-card text-foreground hover:bg-muted/60",
                      )}
                    />
                  }
                >
                  <span className="text-[13px] leading-none">{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-56 text-center">
                  {reactionTooltipText(reaction, currentUserId)}
                </TooltipContent>
              </Tooltip>
            ))}
            <EmojiReactionPicker
              onSelect={(emoji) => void onReact(comment.id, emoji)}
              triggerClassName="h-6 gap-1 rounded-full border border-sidebar-border bg-card px-2 text-[12px] text-muted-foreground hover:border-primary/30 hover:bg-muted/60 hover:text-foreground"
              contentAlign="start"
            />
          </div>
        ) : null}
      </div>
      {!editing ? (
        <div className="pointer-events-none absolute right-5 top-1 z-10 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <div className="flex items-center overflow-hidden rounded-md border border-sidebar-border bg-popover shadow-lg">
            <EmojiReactionPicker
              onSelect={(emoji) => void onReact(comment.id, emoji)}
              triggerClassName="h-8 w-8 justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              contentAlign="end"
            />
            {mine ? (
              <>
                <button
                  type="button"
                  aria-label="Delete comment"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Edit comment"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-info/10 hover:text-info"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmojiReactionPicker({
  onSelect,
  triggerClassName,
  contentAlign = "start",
}: {
  onSelect: (emoji: string) => void;
  triggerClassName?: string;
  contentAlign?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const reactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return QUICK_REACTIONS;
    return QUICK_REACTIONS.filter((emoji) =>
      (REACTION_LABELS[emoji] ?? emoji).toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  function handleEmojiSelect(emoji: string) {
    onSelect(emoji);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex cursor-pointer items-center rounded-none transition-colors hover:text-foreground",
          triggerClassName,
        )}
        aria-label="Add reaction"
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align={contentAlign}
        sideOffset={6}
        className="w-72 rounded-xl border border-border bg-popover p-2 shadow-xl"
      >
        <div className="relative">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reactions"
            className="h-8 rounded-lg bg-card pl-8 text-xs"
          />
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {reactions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              title={REACTION_LABELS[emoji] ?? emoji}
              onClick={() => handleEmojiSelect(emoji)}
              className="flex h-9 cursor-pointer items-center justify-center rounded-lg text-lg transition-colors hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            >
              {emoji}
            </button>
          ))}
        </div>
        {reactions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">No reactions found.</p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function applyReactionUpdate(
  comment: IssueComment,
  update: {
    emoji: string;
    count: number;
    reactedByMe?: boolean;
    users?: Array<{ id: string; name: string; email: string }>;
  },
): IssueComment {
  const reactions = [...comment.reactions];
  const index = reactions.findIndex((reaction) => reaction.emoji === update.emoji);
  if (update.count === 0) {
    if (index >= 0) reactions.splice(index, 1);
  } else if (index >= 0) {
    reactions[index] = {
      ...reactions[index],
      count: update.count,
      reactedByMe: update.reactedByMe ?? reactions[index].reactedByMe,
      users: update.users ?? reactions[index].users,
    };
  } else {
    reactions.push({
      emoji: update.emoji,
      count: update.count,
      reactedByMe: update.reactedByMe ?? false,
      users: update.users ?? [],
    });
  }

  return {
    ...comment,
    reactions,
    reactionCount: reactions.reduce((total, reaction) => total + reaction.count, 0),
    reactedByMe: reactions.some((reaction) => reaction.reactedByMe),
  };
}

function optimisticToggleReaction(
  comment: IssueComment,
  emoji: string,
  currentUserId: string,
  currentUserName: string,
): IssueComment {
  const reactions = [...comment.reactions];
  const index = reactions.findIndex((reaction) => reaction.emoji === emoji);
  const currentUser = { id: currentUserId, name: currentUserName, email: "" };

  if (index < 0) {
    reactions.push({ emoji, count: 1, reactedByMe: true, users: [currentUser] });
  } else {
    const current = reactions[index];
    const nextCount = current.reactedByMe ? current.count - 1 : current.count + 1;
    const nextUsers = current.reactedByMe
      ? current.users.filter((user) => user.id !== currentUserId)
      : [...current.users.filter((user) => user.id !== currentUserId), currentUser];

    if (nextCount <= 0) {
      reactions.splice(index, 1);
    } else {
      reactions[index] = {
        ...current,
        count: nextCount,
        reactedByMe: !current.reactedByMe,
        users: nextUsers,
      };
    }
  }

  return {
    ...comment,
    reactions,
    reactionCount: reactions.reduce((total, reaction) => total + reaction.count, 0),
    reactedByMe: reactions.some((reaction) => reaction.reactedByMe),
  };
}

function reactionTooltipText(
  reaction: IssueComment["reactions"][number],
  currentUserId: string,
) {
  if (!reaction.users.length) {
    return reaction.count === 1 ? "1 reaction" : `${reaction.count} reactions`;
  }

  const names = reaction.users.map((user) => (user.id === currentUserId ? "You" : user.name || user.email));
  if (names.length === 1) return `${names[0]} reacted with ${reaction.emoji}`;
  if (names.length === 2) return `${names[0]} and ${names[1]} reacted with ${reaction.emoji}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} reacted with ${reaction.emoji}`;
}
