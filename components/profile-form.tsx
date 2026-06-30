"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileState } from "@/lib/actions/profile";

export function ProfileForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  );

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Name</Label>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          defaultValue={defaultName}
          placeholder="Your name"
        />
        <p className="text-xs text-muted-foreground">
          Shown across the workspace. If left blank, your email is shown instead.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
        />
      </div>

      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state && "ok" in state && (
        <p className="text-sm text-emerald-400">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
