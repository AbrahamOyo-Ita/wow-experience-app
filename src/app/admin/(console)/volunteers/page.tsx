"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/field";
import { VolunteerStatusBadge } from "@/components/ui/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { Metric, PageHeader, Surface } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { WHATSAPP_GROUP_ONBOARDING } from "@/data/admin";
import { volunteerTeams } from "@/data/content";
import {
  contactEmail,
  contactName,
  contactPhone,
  inEdition,
  maskGroupLink,
  teamLabel,
} from "@/lib/admin";
import { volunteerService } from "@/services";
import { formatDateTime } from "@/lib/utils";
import type { VolunteerApplication, VolunteerStatus } from "@/types";

const STATUSES: VolunteerStatus[] = [
  "submitted",
  "under_review",
  "accepted",
  "waitlisted",
  "declined",
];

export default function AdminVolunteersPage() {
  const { edition } = useEdition();
  const { volunteers, refresh } = useAdminData();
  const [team, setTeam] = useState("all");
  const [rows, setRows] = useState(volunteers);
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setRows(volunteers), 0);
    return () => window.clearTimeout(id);
  }, [volunteers]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (!inEdition(row.eventId, edition)) return false;
        if (team !== "all" && row.teamId !== team) return false;
        return true;
      }),
    [edition, rows, team],
  );

  const pipeline = useMemo(() => {
    const base = rows.filter((row) => inEdition(row.eventId, edition));
    return {
      submitted: base.filter((row) => row.status === "submitted").length,
      under_review: base.filter((row) => row.status === "under_review").length,
      accepted: base.filter((row) => row.status === "accepted").length,
      waitlisted: base.filter((row) => row.status === "waitlisted").length,
      declined: base.filter((row) => row.status === "declined").length,
    };
  }, [edition, rows]);

  const setStatus = async (id: string, status: VolunteerStatus) => {
    setUpdating(true);
    const result = await volunteerService.updateStatus(id, status);
    setUpdating(false);
    if (result.status === "success") {
      setRows((list) => list.map((row) => (row.id === id ? result.data : row)));
      setSelected((row) => (row && row.id === id ? result.data : row));
      await refresh();
    }
  };

  const columns: DataTableColumn<VolunteerApplication>[] = [
    {
      key: "name",
      header: "Applicant",
      sortValue: (row) => contactName(row.contactId),
      render: (row) => (
        <button type="button" className="text-left font-semibold" onClick={() => setSelected(row)}>
          {contactName(row.contactId)}
        </button>
      ),
    },
    {
      key: "team",
      header: "Team",
      sortValue: (row) => teamLabel(row.teamId),
      render: (row) => teamLabel(row.teamId),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => <VolunteerStatusBadge status={row.status} />,
    },
    {
      key: "created",
      header: "Submitted",
      sortValue: (row) => row.createdAt,
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  const preview = selected
    ? maskGroupLink(WHATSAPP_GROUP_ONBOARDING)
        .replaceAll("{{first_name}}", contactName(selected.contactId).split(" ")[0] ?? "friend")
        .replaceAll("{{volunteer_team}}", teamLabel(selected.teamId))
        .replaceAll("{{event_name}}", edition.name)
    : "";

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Volunteers"
        description="Review applications. Acceptance previews the private group note without exposing the live URL."
      />

      <div className="grid gap-3 sm:grid-cols-5">
        <Metric label="Submitted" value={pipeline.submitted} />
        <Metric label="Under review" value={pipeline.under_review} />
        <Metric label="Accepted" value={pipeline.accepted} />
        <Metric label="Waitlisted" value={pipeline.waitlisted} />
        <Metric label="Declined" value={pipeline.declined} />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        searchPlaceholder="Search applicant or team"
        searchFilter={(row, q) =>
          `${contactName(row.contactId)} ${teamLabel(row.teamId)} ${row.status}`
            .toLowerCase()
            .includes(q)
        }
        filters={
          <SelectInput
            id="volunteer-team-filter"
            className="w-48"
            buttonClassName="h-10 rounded-sm px-3 text-sm"
            value={team}
            onValueChange={setTeam}
            aria-label="Team filter"
            options={[
              { value: "all", label: "All teams" },
              ...volunteerTeams.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        }
        emptyTitle="No applications"
        emptyBody="Nothing in this team or edition yet."
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? contactName(selected.contactId) : "Application"}
        description={selected ? teamLabel(selected.teamId) : undefined}
        wide
      >
        {selected ? (
          <div className="grid gap-4 text-sm">
            <p>{contactEmail(selected.contactId)}</p>
            <p>{contactPhone(selected.contactId)}</p>
            <Surface title="Experience">
              <p>{selected.experience}</p>
            </Surface>
            <Surface title="Availability">
              <p>{selected.availability}</p>
            </Surface>
            <Surface title="Motivation">
              <p>{selected.motivation}</p>
            </Surface>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={selected.status === status ? "default" : "outlineDark"}
                  disabled={updating}
                  onClick={() => setStatus(selected.id, status)}
                >
                  {status.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
            {selected.status === "accepted" ? (
              <Surface title="WhatsApp onboarding preview">
                <pre className="whitespace-pre-wrap font-sans text-sm text-ink">{preview}</pre>
              </Surface>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
