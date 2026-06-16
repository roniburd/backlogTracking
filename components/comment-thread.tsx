"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, type CommentState } from "@/lib/actions/comments";

export type ThreadComment = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
};

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommentThread({
  workItemId,
  comments,
}: {
  workItemId: string;
  comments: ThreadComment[];
}) {
  const [state, formAction, pending] = useActionState<CommentState, FormData>(
    addComment.bind(null, workItemId),
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) formRef.current?.reset();
  }, [state, comments.length]);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">Comments &amp; updates</h2>

      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea
          name="body"
          rows={2}
          required
          placeholder="Add an update…"
        />
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post update"}
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {c.author_name}
                </span>
                <span>{when(c.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
