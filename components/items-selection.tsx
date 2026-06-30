"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildItemsCsv,
  csvByteSize,
  formatBytes,
  CSV_MAX_BYTES,
} from "@/lib/csv";
import type { WorkItemRow } from "@/lib/db";

type SelectionContextValue = {
  rows: WorkItemRow[];
  /** Selectable row ids, in view order. */
  ids: string[];
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return ctx;
}

/**
 * Holds which rows are checked and exposes it to the row checkboxes and the
 * download button. Wraps the (server-rendered) table so the checkboxes nested
 * inside it can read and mutate the shared selection through context.
 */
export function SelectionProvider({
  rows,
  children,
}: {
  rows: WorkItemRow[];
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const ids = useMemo(
    () => rows.map((r) => r.id).filter((id): id is string => !!id),
    [rows],
  );

  const value = useMemo<SelectionContextValue>(
    () => ({
      rows,
      ids,
      selected,
      toggle: (id) =>
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      toggleAll: () =>
        setSelected((prev) =>
          ids.length > 0 && ids.every((id) => prev.has(id))
            ? new Set()
            : new Set(ids),
        ),
    }),
    [rows, ids, selected],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

const checkboxClass = "size-4 cursor-pointer accent-primary";

/** Per-row selection checkbox. */
export function RowSelectCheckbox({ id }: { id: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      aria-label="Select item"
      className={checkboxClass}
      checked={selected.has(id)}
      onChange={() => toggle(id)}
    />
  );
}

/** Header "select all" checkbox, with an indeterminate state for partial selection. */
export function SelectAllCheckbox() {
  const { ids, selected, toggleAll } = useSelection();
  const ref = useRef<HTMLInputElement>(null);

  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = ids.some((id) => selected.has(id));

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all items"
      className={checkboxClass}
      checked={allSelected}
      disabled={ids.length === 0}
      onChange={toggleAll}
    />
  );
}

/**
 * Downloads the current view as a CSV. When rows are selected it exports just
 * those; otherwise it exports the whole filtered view (every matching row, not
 * only what's on screen). Exports over {@link CSV_MAX_BYTES} are blocked with a
 * warning so the user knows why nothing downloaded.
 */
export function DownloadCsvButton() {
  const { rows, selected } = useSelection();

  // Intersect with the current rows: a previously-selected item can drop out of
  // the view after a filter/sort change, and we must not count or export it.
  const selectedRows = rows.filter((r) => r.id && selected.has(r.id));

  function download() {
    const chosen = selectedRows.length > 0 ? selectedRows : rows;

    if (chosen.length === 0) {
      toast.warning("No items to download.");
      return;
    }

    const csv = buildItemsCsv(chosen);
    const size = csvByteSize(csv);
    if (size > CSV_MAX_BYTES) {
      toast.warning(
        `This export is ${formatBytes(size)}, over the ${formatBytes(
          CSV_MAX_BYTES,
        )} limit. Narrow your filters or select fewer items.`,
      );
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-items-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const count = selectedRows.length;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={download}
      disabled={rows.length === 0}
    >
      <Download />
      {count > 0 ? `Download CSV (${count})` : "Download CSV"}
    </Button>
  );
}
