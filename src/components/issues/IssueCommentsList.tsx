"use client";

import { IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import { formatDistanceToNow } from "date-fns";

export type IssueComment = {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; email: string; image?: string | null };
};

export function IssueCommentsList({ comments }: { comments: IssueComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-[#80868b]">No comments yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#e8eaed]">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3 py-4">
          <IssueUserAvatar
            name={comment.author.name || comment.author.email}
            image={comment.author.image}
            className="size-7"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium text-foreground">
                {comment.author.name || comment.author.email}
              </span>
              <span className="text-xs text-[#80868b]">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true }).replace(/^about /, "")}
              </span>
            </div>
            <p className="mt-1.5 rounded-lg bg-[#f8f9fa] px-3 py-2 text-sm text-foreground">
              {comment.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
