"use client";

import { useMemo, useState } from "react";
import { SelectInput } from "@/components/ui/field";
import { Drawer } from "@/components/admin/drawer";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { useAdminData } from "@/components/admin/admin-data";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/types";

export default function AdminAuditPage() {
  const { auditLogs } = useAdminData();
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [actor, setActor] = useState("all");

  const actors = useMemo(
    () => Array.from(new Set(auditLogs.map((row) => row.actorName))),
    [auditLogs],
  );

  const rows = useMemo(
    () => auditLogs.filter((row) => actor === "all" || row.actorName === actor),
    [actor, auditLogs],
  );

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "actor",
      header: "Actor",
      sortValue: (row) => row.actorName,
      render: (row) => row.actorName,
    },
    {
      key: "action",
      header: "Action",
      sortValue: (row) => row.action,
      render: (row) => (
        <button type="button" className="text-left font-semibold" onClick={() => setSelected(row)}>
          {row.action}
        </button>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (row) => `${row.entityType} / ${row.entityId}`,
    },
    {
      key: "date",
      header: "Date",
      sortValue: (row) => row.createdAt,
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: "meta",
      header: "Metadata",
      render: (row) => <span className="text-muted">{row.metadataPreview}</span>,
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Audit"
        description="Who changed what. Search by actor, action or entity."
      />
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search actor, action, entity"
        searchFilter={(row, q) =>
          `${row.actorName} ${row.action} ${row.entityType} ${row.entityId} ${row.metadataPreview}`
            .toLowerCase()
            .includes(q)
        }
        filters={
          <SelectInput
            id="audit-actor-filter"
            className="w-48"
            buttonClassName="h-10 rounded-sm px-3 text-sm"
            value={actor}
            onValueChange={setActor}
            aria-label="Actor filter"
            options={[
              { value: "all", label: "All actors" },
              ...actors.map((name) => ({ value: name, label: name })),
            ]}
          />
        }
      />
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.action ?? "Event"}
        description={selected ? formatDateTime(selected.createdAt) : undefined}
      >
        {selected ? (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted">Actor</dt>
              <dd className="font-semibold">{selected.actorName}</dd>
            </div>
            <div>
              <dt className="text-muted">Entity</dt>
              <dd>
                {selected.entityType} / {selected.entityId}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Metadata preview</dt>
              <dd className="mt-1 border border-border bg-paper p-3 font-mono text-xs">
                {selected.metadataPreview}
              </dd>
            </div>
          </dl>
        ) : null}
      </Drawer>
    </div>
  );
}
