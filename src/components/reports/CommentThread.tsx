"use client";

import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextarea } from "@/components/common/hook-form/RHFTextarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createCommentFormSchema, type CreateCommentFormData } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; email: string };
};

export function CommentThread({ reportId, comments }: { reportId: string; comments: Comment[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const methods = useForm<CreateCommentFormData>({
    resolver: zodResolver(createCommentFormSchema),
    defaultValues: { content: "" },
    mode: "onSubmit",
  });

  async function onSubmit(data: CreateCommentFormData) {
    setServerError("");

    const response = await fetch(`/api/reports/${reportId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      setServerError("Could not post comment. Please try again.");
      return;
    }

    methods.reset();
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Comments</h2>
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border border-sidebar-border dark:bg-surface-elevated">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{comment.author.name}</span>
                  <span className="text-muted-foreground">{comment.author.email}</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{comment.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3">
        <RHFTextarea name="content" placeholder="Add a comment" rows={4} required />
        {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
        <Button type="submit" disabled={methods.formState.isSubmitting}>
          <Send className="h-4 w-4" />
          {methods.formState.isSubmitting ? "Posting..." : "Post comment"}
        </Button>
      </FormProvider>
    </section>
  );
}
