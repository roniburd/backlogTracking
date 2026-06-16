"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Bookmark, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSavedQuery,
  deleteSavedQuery,
  type SaveState,
} from "@/lib/actions/saved-queries";
import type { SavedQuery } from "@/lib/db";

function queryHref(def: SavedQuery["definition"]): string {
  const params = new URLSearchParams(
    Object.entries((def as Record<string, string>) ?? {}).map(([k, v]) => [
      k,
      String(v),
    ]),
  );
  const qs = params.toString();
  return qs ? `/items?${qs}` : "/items";
}

function QueryChip({
  q,
  canDelete,
}: {
  q: SavedQuery;
  canDelete: boolean;
}) {
  const router = useRouter();
  return (
    <span className="inline-flex items-center overflow-hidden rounded-full border text-sm">
      <Link href={queryHref(q.definition)} className="py-1 pl-3 pr-2 hover:bg-muted">
        {q.name}
      </Link>
      {canDelete && (
        <button
          type="button"
          aria-label={`Delete ${q.name}`}
          onClick={async () => {
            await deleteSavedQuery(q.id);
            router.refresh();
          }}
          className="border-l px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export function SavedQueryBar({
  personal,
  team,
  currentParams,
  isAdmin,
  currentUserId,
}: {
  personal: SavedQuery[];
  team: SavedQuery[];
  currentParams: Record<string, string>;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    createSavedQuery,
    null,
  );

  useEffect(() => {
    // Respond to the server action result: close the dialog and refresh.
    if (state && "ok" in state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      toast.success("View saved");
      router.refresh();
    }
  }, [state, router]);

  const hasCurrent = Object.keys(currentParams).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Bookmark className="size-3.5" /> Saved
      </span>

      {personal.length === 0 && team.length === 0 && (
        <span className="text-xs text-muted-foreground">none yet</span>
      )}

      {personal.map((q) => (
        <QueryChip key={q.id} q={q} canDelete />
      ))}
      {team.map((q) => (
        <span key={q.id} className="inline-flex items-center gap-1">
          <QueryChip q={q} canDelete={isAdmin || q.owner === currentUserId} />
          <span className="text-[10px] uppercase text-muted-foreground">
            team
          </span>
        </span>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button size="sm" variant="outline" disabled={!hasCurrent}>
              <Plus className="size-3.5" /> Save view
            </Button>
          }
        />
        <DialogContent>
          <form
            action={(fd) => {
              formAction(fd);
            }}
          >
            <DialogHeader>
              <DialogTitle>Save current view</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scope">Scope</Label>
                <select
                  id="scope"
                  name="scope"
                  defaultValue="personal"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="personal">Personal</option>
                  {isAdmin && <option value="team">Team</option>}
                </select>
              </div>
              <input
                type="hidden"
                name="definition"
                value={JSON.stringify(currentParams)}
              />
              {state && "error" in state && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
