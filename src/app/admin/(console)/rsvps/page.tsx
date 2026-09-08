"use client";

import { useMemo, useState } from "react";
import { SelectInput } from "@/components/ui/field";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { editions } from "@/data/editions";
import {
  contactEmail,
  contactName,
  contactPhone,
  consentSummary,
  inEdition,
  labelChannel,
} from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";
import type { Rsvp, RsvpResponse } from "@/types";

export default function AdminRsvpsPage() {
  const { edition } = useEdition();
  const { rsvps, contacts } = useAdminData();
  const [response, setResponse] = useState<RsvpResponse | "all">("all");
  const [scope, setScope] = useState<"edition" | "all">("edition");

  const rows = useMemo(() => {
    return rsvps.filter((row) => {
      if (scope === "edition" && !inEdition(row.eventId, edition)) return false;
      if (response !== "all" && row.response !== response) return false;
      return true;
    });
  }, [edition, response, rsvps, scope]);

  const columns: DataTableColumn<Rsvp>[] = [
    {
      key: "edition",
      header: "Edition",
      sortValue: (row) => row.eventId,
      render: (row) =>
        editions.find(
          (item) => item.id === row.eventId || `edition-${item.year}` === row.eventId,
        )?.shortName ?? row.eventId,
    },
    {
      key: "name",
      header: "Guest",
      sortValue: (row) => contactName(row.contactId),
      render: (row) => contactName(row.contactId),
    },
    {
      key: "response",
      header: "Response",
      sortValue: (row) => row.response,
      render: (row) => (row.response === "attending" ? "Attending" : "Not attending"),
    },
    {
      key: "whatsapp",
      header: "WhatsApp",
      render: (row) => contactPhone(row.contactId),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => contactEmail(row.contactId),
    },
    {
      key: "channel",
      header: "Preferred",
      sortValue: (row) => row.preferredChannel,
      render: (row) => labelChannel(row.preferredChannel),
    },
    {
      key: "consent",
      header: "Consent",
      render: (row) => consentSummary(row.contactId),
    },
    {
      key: "created",
      header: "Created",
      sortValue: (row) => row.createdAt,
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="RSVPs"
        description="Intent to attend. This is not door attendance."
      />
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search guest, channel or edition"
        searchFilter={(row, q) => {
          const contact = contacts.find((item) => item.id === row.contactId);
          return `${contactName(row.contactId)} ${contactEmail(row.contactId)} ${row.response} ${
            contact ? consentSummary(contact.id) : ""
          }`
            .toLowerCase()
            .includes(q);
        }}
        filters={
          <>
            <SelectInput
              id="rsvp-scope-filter"
              className="w-44"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={scope}
              onValueChange={(value) => setScope(value as typeof scope)}
              aria-label="Edition scope"
              options={[
                { value: "edition", label: "This edition" },
                { value: "all", label: "All editions" },
              ]}
            />
            <SelectInput
              id="rsvp-response-filter"
              className="w-44"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={response}
              onValueChange={(value) => setResponse(value as typeof response)}
              aria-label="Response filter"
              options={[
                { value: "all", label: "All responses" },
                { value: "attending", label: "Attending" },
                { value: "not_attending", label: "Not attending" },
              ]}
            />
          </>
        }
        emptyTitle="No RSVPs"
        emptyBody="No responses match this edition and filter."
      />
    </div>
  );
}
