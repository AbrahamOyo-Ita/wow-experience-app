"use client";

import { useMemo, useState } from "react";
import { SelectInput } from "@/components/ui/field";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { PageHeader } from "@/components/admin/page-header";
import { useAdminData } from "@/components/admin/admin-data";
import { TEMPLATE_VARIABLES } from "@/data/admin";
import { maskGroupLink } from "@/lib/admin";
import type { MessageTemplate } from "@/types";

export default function AdminTemplatesPage() {
  const { templates } = useAdminData();
  const [channel, setChannel] = useState<"all" | "email" | "whatsapp">("all");
  const [selected, setSelected] = useState<MessageTemplate | null>(null);

  const rows = useMemo(
    () => templates.filter((row) => channel === "all" || row.channel === channel),
    [channel, templates],
  );

  const columns: DataTableColumn<MessageTemplate>[] = [
    {
      key: "name",
      header: "Template",
      sortValue: (row) => row.name,
      render: (row) => (
        <button type="button" className="text-left font-semibold" onClick={() => setSelected(row)}>
          {row.name}
        </button>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      sortValue: (row) => row.channel,
      render: (row) => (row.channel === "whatsapp" ? "WhatsApp" : "Email"),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => row.category.replaceAll("_", " "),
    },
    {
      key: "version",
      header: "Version",
      sortValue: (row) => row.version,
      render: (row) => `v${row.version}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => row.status,
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Templates"
        description="Email and WhatsApp copy with merge variables. Group links stay masked in previews."
      />
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search templates"
        searchFilter={(row, q) =>
          `${row.name} ${row.category} ${row.body}`.toLowerCase().includes(q)
        }
        filters={
          <SelectInput
            id="template-channel-filter"
            className="w-44"
            buttonClassName="h-10 rounded-sm px-3 text-sm"
            value={channel}
            onValueChange={(value) => setChannel(value as typeof channel)}
            aria-label="Channel filter"
            options={[
              { value: "all", label: "All channels" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "email", label: "Email" },
            ]}
          />
        }
      />
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Template"}
        description={selected ? `${selected.channel} / ${selected.category}` : undefined}
        wide
      >
        {selected ? (
          <div className="grid gap-4 text-sm">
            {selected.subject ? <p className="font-semibold">{selected.subject}</p> : null}
            <pre className="whitespace-pre-wrap border border-border bg-paper p-3 font-sans">
              {maskGroupLink(selected.body)}
            </pre>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Variables</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {(selected.variables.length ? selected.variables : TEMPLATE_VARIABLES).map(
                  (token) => (
                    <li key={token} className="border border-border px-2 py-1 text-xs">
                      {`{{${token}}}`}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
