"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { toggleAutomationAction } from "@/actions/admin";
import { inEdition, labelChannel } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";
import type { AutomationRule } from "@/types";

export default function AdminAutomationsPage() {
  const { edition } = useEdition();
  const { automations, refresh } = useAdminData();
  const [rows, setRows] = useState(automations);

  useEffect(() => {
    const id = window.setTimeout(() => setRows(automations), 0);
    return () => window.clearTimeout(id);
  }, [automations]);

  const visible = useMemo(
    () => rows.filter((row) => inEdition(row.eventId, edition)),
    [edition, rows],
  );

  const toggle = async (id: string) => {
    const current = rows.find((row) => row.id === id);
    if (!current) return;
    setRows((list) =>
      list.map((row) => (row.id === id ? { ...row, enabled: !row.enabled } : row)),
    );
    await toggleAutomationAction(id, !current.enabled);
    await refresh();
  };

  const columns: DataTableColumn<AutomationRule>[] = [
    {
      key: "name",
      header: "Rule",
      sortValue: (row) => row.name,
      render: (row) => row.name,
    },
    {
      key: "trigger",
      header: "Trigger",
      render: (row) => row.triggerType.replaceAll("_", " "),
    },
    {
      key: "channel",
      header: "Channel",
      render: (row) =>
        row.channelMode === "fallback" ? "WhatsApp, email fallback" : labelChannel(row.channelMode),
    },
    {
      key: "next",
      header: "Next run",
      sortValue: (row) => row.nextRunAt ?? "",
      render: (row) => (row.nextRunAt ? formatDateTime(row.nextRunAt) : "On trigger"),
    },
    {
      key: "last",
      header: "Last run",
      sortValue: (row) => row.lastRunAt ?? "",
      render: (row) =>
        row.lastRunAt
          ? `${formatDateTime(row.lastRunAt)} (${String(row.lastRunStatus ?? "unknown")})`
          : "Never",
    },
    {
      key: "enabled",
      header: "Enabled",
      render: (row) => (
        <button
          type="button"
          role="switch"
          aria-checked={row.enabled}
          className={`h-7 w-12 border ${row.enabled ? "border-ink bg-ink" : "border-border bg-paper"}`}
          onClick={() => toggle(row.id)}
        >
          <span className="sr-only">{row.enabled ? "On" : "Off"}</span>
          <span
            className={`block h-5 w-5 bg-white transition ${row.enabled ? "translate-x-6" : "translate-x-0.5"}`}
          />
        </button>
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Automations"
        description="Seven reminder and confirmation rules. Toggles stay in this browser only."
      />
      <DataTable
        columns={columns}
        rows={visible}
        searchPlaceholder="Search rules"
        searchFilter={(row, q) => `${row.name} ${row.triggerType}`.toLowerCase().includes(q)}
      />
    </div>
  );
}
