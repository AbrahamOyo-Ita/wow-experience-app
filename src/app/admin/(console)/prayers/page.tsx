"use client";

import { useMemo, useState } from "react";
import { Download, Flag, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/field";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { PageHeader } from "@/components/admin/page-header";
import { useAdminData } from "@/components/admin/admin-data";
import { formatDateTime } from "@/lib/utils";
import type { PrayerRequest } from "@/types";

type StatusFilter = PrayerRequest["status"] | "all";

function csvCell(value: string | number | boolean | null | undefined) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function exportPrayerRequests(rows: PrayerRequest[]) {
  const headers = [
    "ID",
    "Name",
    "Anonymous",
    "Urgent",
    "Prayer point",
    "What they want God to do at the event",
    "Status",
    "Source",
    "Submitted",
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      row.isAnonymous ? "" : row.name,
      row.isAnonymous,
      row.isUrgent,
      row.prayerPoint,
      row.desiredOutcome,
      row.status,
      row.source,
      row.createdAt,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [headers.map(csvCell).join(","), ...lines].join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `wow-prayer-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminPrayersPage() {
  const { prayerRequests, loading } = useAdminData();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [visibility, setVisibility] = useState<"all" | "urgent" | "anonymous">("all");
  const [selected, setSelected] = useState<PrayerRequest | null>(null);

  const rows = useMemo(
    () =>
      prayerRequests.filter((row) => {
        if (status !== "all" && row.status !== status) return false;
        if (visibility === "urgent" && !row.isUrgent) return false;
        if (visibility === "anonymous" && !row.isAnonymous) return false;
        return true;
      }),
    [prayerRequests, status, visibility],
  );

  const columns: DataTableColumn<PrayerRequest>[] = [
    {
      key: "submitted",
      header: "Submitted",
      sortValue: (row) => row.createdAt,
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: "name",
      header: "Name",
      sortValue: (row) => row.name ?? "",
      render: (row) => (row.isAnonymous ? "Anonymous" : row.name || "Not provided"),
    },
    {
      key: "point",
      header: "Prayer point",
      render: (row) => <p className="max-w-[26rem] whitespace-pre-wrap">{row.prayerPoint}</p>,
    },
    {
      key: "outcome",
      header: "Trusting God for",
      render: (row) => <p className="max-w-[22rem] whitespace-pre-wrap">{row.desiredOutcome}</p>,
    },
    {
      key: "flags",
      header: "Flags",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.isUrgent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-soft px-2 py-1 text-xs font-semibold text-red-deep">
              <Flag className="h-3 w-3" aria-hidden="true" /> Urgent
            </span>
          ) : null}
          {row.isAnonymous ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-1 text-xs font-semibold text-muted">
              <LockKeyhole className="h-3 w-3" aria-hidden="true" /> Private
            </span>
          ) : null}
          {!row.isUrgent && !row.isAnonymous ? "-" : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => row.status,
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Prayer requests"
        description="Private prayer points submitted for the event. Select a row to read the full request."
        actions={
          <Button
            type="button"
            variant="outlineDark"
            className="gap-2"
            disabled={loading || rows.length === 0}
            onClick={() => exportPrayerRequests(rows)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export {rows.length} rows
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={setSelected}
        searchPlaceholder="Search name, prayer point or request"
        searchFilter={(row, query) =>
          `${row.name ?? ""} ${row.prayerPoint} ${row.desiredOutcome} ${row.status}`
            .toLowerCase()
            .includes(query)
        }
        filters={
          <>
            <SelectInput
              id="prayer-status-filter"
              className="w-40"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
              aria-label="Prayer status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "received", label: "Received" },
                { value: "praying", label: "Praying" },
                { value: "answered", label: "Answered" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <SelectInput
              id="prayer-visibility-filter"
              className="w-40"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={visibility}
              onValueChange={(value) => setVisibility(value as typeof visibility)}
              aria-label="Prayer flags"
              options={[
                { value: "all", label: "All requests" },
                { value: "urgent", label: "Urgent only" },
                { value: "anonymous", label: "Anonymous only" },
              ]}
            />
          </>
        }
        emptyTitle="No prayer requests"
        emptyBody="Submitted prayer points will appear here after the database migration is applied."
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Prayer request"
        description={selected ? formatDateTime(selected.createdAt) : undefined}
      >
        {selected ? (
          <div className="grid gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">From</p>
              <p className="mt-1 font-semibold text-ink">
                {selected.isAnonymous ? "Anonymous" : selected.name || "Name not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Prayer point</p>
              <p className="mt-2 whitespace-pre-wrap leading-6 text-ink">{selected.prayerPoint}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">What they want God to do at the event</p>
              <p className="mt-2 whitespace-pre-wrap leading-6 text-ink">{selected.desiredOutcome}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted">
              <span className="rounded-full border border-border px-2.5 py-1">Status: {selected.status}</span>
              {selected.isUrgent ? <span className="rounded-full bg-red-soft px-2.5 py-1 text-red-deep">Urgent</span> : null}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
