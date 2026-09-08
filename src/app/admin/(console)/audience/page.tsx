"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/field";
import { Drawer } from "@/components/admin/drawer";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { consentSummary, inEdition, labelChannel } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";
import type { Channel, Contact } from "@/types";

export default function AdminAudiencePage() {
  const { edition } = useEdition();
  const { contacts, consents, rsvps, attendance } = useAdminData();
  const [channel, setChannel] = useState<Channel | "all">("all");
  const [consent, setConsent] = useState<"all" | "granted" | "revoked">("all");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const rows = useMemo(() => {
    return contacts.filter((contact) => {
      if (channel !== "all" && contact.preferredChannel !== channel) return false;
      const rowsFor = consents.filter((row) => row.contactId === contact.id);
      if (consent === "granted" && !rowsFor.some((row) => row.status === "granted")) return false;
      if (consent === "revoked" && rowsFor.some((row) => row.status === "granted")) return false;
      return true;
    });
  }, [channel, consent, contacts, consents]);

  const exportCsv = () => {
    const header = ["first_name", "last_name", "email", "phone", "channel", "consent", "created_at"];
    const lines = rows.map((row) =>
      [
        row.firstName,
        row.lastName,
        row.email ?? "",
        row.phone,
        row.preferredChannel,
        consentSummary(row.id),
        row.createdAt,
      ]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wow-audience-${edition.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBanner(
      `Mock CSV downloaded (${rows.length} rows). In production this export would be audited before leaving the server.`,
    );
  };

  const attendanceCount = (contactId: string) =>
    attendance.filter((row) => row.contactId === contactId).length;

  const columns: DataTableColumn<Contact>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (row) => `${row.firstName} ${row.lastName}`,
      render: (row) => (
        <button type="button" className="text-left font-semibold" onClick={() => setSelected(row)}>
          {row.firstName} {row.lastName}
        </button>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      sortValue: (row) => row.preferredChannel,
      render: (row) => labelChannel(row.preferredChannel),
    },
    {
      key: "consent",
      header: "Consent",
      render: (row) => consentSummary(row.id),
    },
    {
      key: "attendance",
      header: "Attendance",
      sortValue: (row) => attendanceCount(row.id),
      render: (row) =>
        attendanceCount(row.id) ? `${attendanceCount(row.id)} visit(s)` : "None yet",
    },
    {
      key: "email",
      header: "Email",
      render: (row) => row.email ?? "None",
    },
    {
      key: "phone",
      header: "WhatsApp",
      render: (row) => row.phone,
    },
    {
      key: "created",
      header: "Added",
      sortValue: (row) => row.createdAt,
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Audience"
        description="People who have given a number or email through RSVP, volunteer or enquiry forms."
        actions={
          <Button type="button" className="bg-ink text-white hover:bg-ink/90" onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      {banner ? (
        <p className="border border-border bg-white px-4 py-3 text-sm text-ink" role="status">
          {banner}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search name, email or number"
        searchFilter={(row, q) =>
          `${row.firstName} ${row.lastName} ${row.email ?? ""} ${row.phone}`
            .toLowerCase()
            .includes(q)
        }
        filters={
          <>
            <SelectInput
              id="audience-channel-filter"
              className="w-44"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={channel}
              onValueChange={(value) => setChannel(value as Channel | "all")}
              aria-label="Filter by channel"
              options={[
                { value: "all", label: "All channels" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "email", label: "Email" },
                { value: "both", label: "Both" },
              ]}
            />
            <SelectInput
              id="audience-consent-filter"
              className="w-44"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={consent}
              onValueChange={(value) => setConsent(value as typeof consent)}
              aria-label="Filter by consent"
              options={[
                { value: "all", label: "All consent" },
                { value: "granted", label: "Granted" },
                { value: "revoked", label: "Revoked / none" },
              ]}
            />
          </>
        }
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.firstName} ${selected.lastName}` : "Contact"}
        description={selected?.location ?? "No location recorded"}
      >
        {selected ? (
          <div className="grid gap-4 text-sm">
            <p>{selected.occupation ?? "Occupation not given"}</p>
            <p className="text-muted">{selected.email ?? "No email"}</p>
            <p className="text-muted">{selected.phone}</p>
            <h3 className="font-display font-bold">Attendance history</h3>
            <ul className="grid gap-2">
              {attendance
                .filter((row) => row.contactId === selected.id)
                .map((row) => (
                  <li key={row.id}>
                    {formatDateTime(row.checkedInAt)} / {row.source} / {row.occupationSnapshot}
                    {row.duplicateOfId ? " (duplicate)" : ""}
                  </li>
                ))}
              {attendance.filter((row) => row.contactId === selected.id).length === 0 ? (
                <li className="text-muted">No attendance records yet.</li>
              ) : null}
            </ul>
            <h3 className="font-display font-bold">RSVPs</h3>
            <ul className="grid gap-2">
              {rsvps
                .filter((row) => row.contactId === selected.id)
                .map((row) => (
                  <li key={row.id}>
                    {row.response} / {formatDateTime(row.createdAt)}
                    {inEdition(row.eventId, edition) ? " / this edition" : ""}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
