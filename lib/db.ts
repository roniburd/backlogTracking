import type { Database } from "@/lib/types";

/** Convenience row-type helper: `Tables<"work_items">`. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type WorkItemRow = Views<"work_items_view">;

export type WorkItem = Tables<"work_items">;
export type Status = Tables<"statuses">;
export type Label = Tables<"labels">;
export type Profile = Tables<"profiles">;
export type Comment = Tables<"comments">;
export type SavedQuery = Tables<"saved_queries">;
export type AuditEntry = Tables<"audit_log">;
