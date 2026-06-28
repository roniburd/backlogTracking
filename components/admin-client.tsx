"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createLabel,
  createStatus,
  deleteLabel,
  deleteStatus,
  setUserAdmin,
  type AdminState,
} from "@/lib/actions/admin";
import { deleteSavedQuery } from "@/lib/actions/saved-queries";
import { profileName } from "@/lib/format";
import { statusDot } from "@/lib/status-color";
import type { Label as LabelRow, Profile, SavedQuery, Status } from "@/lib/db";
import { cn } from "@/lib/utils";

const COLORS = ["gray", "green", "amber", "orange", "red", "blue", "teal", "purple"];
const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm";

function useRefreshAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });
  return { pending, run };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-white/15">
      <div>
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function AdminClient({
  statuses,
  labels,
  users,
  teamQueries,
  currentUserId,
}: {
  statuses: Status[];
  labels: LabelRow[];
  users: Profile[];
  teamQueries: SavedQuery[];
  currentUserId: string;
}) {
  const { pending, run } = useRefreshAction();
  const [statusState, statusAction, statusPending] = useActionState<
    AdminState,
    FormData
  >(createStatus, null);
  const [labelState, labelAction, labelPending] = useActionState<
    AdminState,
    FormData
  >(createLabel, null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Section
        title="Statuses"
        description="The workflow states available on work items."
      >
        <ul className="divide-y">
          {statuses.map((s) => (
            <li key={s.id} className="flex items-center gap-2 py-2 text-sm">
              <span className={cn("size-2 rounded-full", statusDot(s.color))} />
              <span className="flex-1 font-medium">{s.label}</span>
              {s.is_attention && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
                  attention
                </span>
              )}
              {s.is_terminal && (
                <span className="rounded-full bg-blue-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-400">
                  terminal
                </span>
              )}
              <span className="w-6 text-right text-xs text-muted-foreground">
                {s.sort_order}
              </span>
              <button
                type="button"
                aria-label={`Delete ${s.label}`}
                disabled={pending}
                onClick={() => run(() => deleteStatus(s.id))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <form action={statusAction} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="s-label" className="text-xs">
              Label
            </Label>
            <Input id="s-label" name="label" required className="h-9 w-36" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-color" className="text-xs">
              Color
            </Label>
            <select id="s-color" name="color" className={selectClass}>
              {COLORS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-order" className="text-xs">
              Order
            </Label>
            <Input
              id="s-order"
              name="sort_order"
              type="number"
              defaultValue={statuses.length + 1}
              className="h-9 w-16"
            />
          </div>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" name="is_attention" /> attention
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" name="is_terminal" /> terminal
          </label>
          <Button type="submit" size="sm" disabled={statusPending}>
            Add
          </Button>
          {statusState && "error" in statusState && (
            <p className="w-full text-sm text-destructive">
              {statusState.error}
            </p>
          )}
        </form>
      </Section>

      <Section title="Labels" description="Tags for categorizing work items.">
        <div className="flex flex-wrap gap-2">
          {labels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-input bg-secondary py-1 pl-3 pr-1.5 text-sm"
            >
              <span className={cn("size-2 rounded-full", statusDot(l.color))} />
              {l.name}
              <button
                type="button"
                aria-label={`Delete ${l.name}`}
                disabled={pending}
                onClick={() => run(() => deleteLabel(l.id))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
          {labels.length === 0 && (
            <span className="text-sm text-muted-foreground">No labels.</span>
          )}
        </div>
        <form action={labelAction} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="l-name" className="text-xs">
              Name
            </Label>
            <Input id="l-name" name="name" required className="h-9 w-36" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="l-color" className="text-xs">
              Color
            </Label>
            <select id="l-color" name="color" className={selectClass}>
              {COLORS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" disabled={labelPending}>
            Add
          </Button>
          {labelState && "error" in labelState && (
            <p className="w-full text-sm text-destructive">
              {labelState.error}
            </p>
          )}
        </form>
      </Section>

      <Section
        title="Users"
        description="Admins can manage statuses, labels, team views, and roles."
      >
        <ul className="divide-y">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <li key={u.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="flex-1">
                  {profileName(u)}
                  {isSelf && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </span>
                {u.is_admin && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--primary-bright)]">
                    admin
                  </span>
                )}
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={pending || isSelf}
                  onClick={() =>
                    run(async () => {
                      await setUserAdmin(u.id, !u.is_admin);
                      toast.success(
                        `${profileName(u)} is ${!u.is_admin ? "now an admin" : "no longer an admin"}`,
                      );
                    })
                  }
                >
                  {u.is_admin ? "Revoke" : "Make admin"}
                </Button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        title="Team saved views"
        description="Shared queries visible to everyone."
      >
        {teamQueries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team views yet.</p>
        ) : (
          <ul className="divide-y">
            {teamQueries.map((q) => (
              <li key={q.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="flex-1">{q.name}</span>
                <button
                  type="button"
                  aria-label={`Delete ${q.name}`}
                  disabled={pending}
                  onClick={() => run(() => deleteSavedQuery(q.id))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
