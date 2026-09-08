"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  searchPlaceholder = "Search",
  searchFilter,
  filters,
  emptyTitle = "Nothing here",
  emptyBody = "No records match the current filters.",
  pageSize = 8,
  loading = false,
  error = null,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  filters?: React.ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
  pageSize?: number;
  loading?: boolean;
  error?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    if (searchFilter) return rows.filter((row) => searchFilter(row, q));
    return rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(q),
    );
  }, [query, rows, searchFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((item) => item.key === sortKey);
    if (!col?.sortValue) return filtered;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [columns, filtered, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleRow = (index: number) => {
    setSelected((set) => {
      const next = new Set(set);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const togglePage = () => {
    const ids = pageRows.map((_, i) => (safePage - 1) * pageSize + i);
    const allOn = ids.every((id) => selected.has(id));
    setSelected((set) => {
      const next = new Set(set);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="grid gap-2 border border-border bg-white p-4" aria-busy>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse bg-paper" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Could not load this table" body={error} />
    );
  }

  return (
    <div className="border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="h-10 w-full border border-border bg-white px-3 text-sm sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      </div>
      {selected.size > 0 ? (
        <p className="border-b border-border bg-paper px-3 py-2 text-sm">
          {selected.size} selected
        </p>
      ) : null}
      {pageRows.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} className="border-0" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-paper text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select page rows"
                    checked={pageRows.every((_, i) =>
                      selected.has((safePage - 1) * pageSize + i),
                    )}
                    onChange={togglePage}
                  />
                </th>
                {columns.map((col) => (
                  <th key={col.key} className={cn("px-3 py-3 font-semibold", col.className)}>
                    {col.sortValue ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort(col.key, true)}
                      >
                        {col.header}
                        {sortKey === col.key ? (sortDir === "asc" ? " ^" : " v") : ""}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const index = (safePage - 1) * pageSize + i;
                return (
                  <tr
                    key={row.id ?? index}
                    className={cn(
                      "border-b border-border last:border-0",
                      selected.has(index) && "bg-red-soft/40",
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selected.has(index)}
                        onChange={() => toggleRow(index)}
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-3 py-3 align-top", col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm text-muted">
        <p>
          {sorted.length} records
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 border border-border px-3 disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="tabular-nums">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className="h-8 border border-border px-3 disabled:opacity-40"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
