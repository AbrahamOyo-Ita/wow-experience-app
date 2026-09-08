"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, PhoneField, TextInput } from "@/components/ui/field";
import { BarList, HourlyBars } from "@/components/admin/chart";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { Metric, PageHeader, Surface } from "@/components/admin/page-header";
import { AttendanceQr } from "@/components/admin/attendance-qr";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { adminCheckIn } from "@/actions/admin";
import { contactName, inEdition } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";
import type { AttendanceRecord } from "@/types";

type Row = AttendanceRecord & { guest: string; duplicate: boolean };

export default function AdminAttendancePage() {
  const { edition } = useEdition();
  const { attendance, rsvps, contacts, refresh } = useAdminData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasLiveData = attendance.some((row) => inEdition(row.eventId, edition));

  const rows: Row[] = useMemo(
    () =>
      attendance
        .filter((row) => inEdition(row.eventId, edition))
        .map((row) => ({
          ...row,
          guest: contactName(row.contactId),
          duplicate: Boolean(row.duplicateOfId ?? row.duplicateOf),
        })),
    [attendance, edition],
  );

  const attending = rsvps.filter(
    (row) => inEdition(row.eventId, edition) && row.response === "attending",
  ).length;

  const occupationItems = Array.from(
    rows.reduce((map, row) => {
      const label = row.occupationSnapshot || "Unspecified";
      map.set(label, (map.get(label) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([label, value]) => ({ label, value }));

  const hourlyItems = Array.from(
    rows.reduce((map, row) => {
      const label = new Date(row.checkedInAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      });
      map.set(label, (map.get(label) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([label, value]) => ({ label, value }));

  const columns: DataTableColumn<Row>[] = [
    {
      key: "guest",
      header: "Guest",
      sortValue: (row) => row.guest,
      render: (row) => row.guest,
    },
    {
      key: "occupation",
      header: "Occupation",
      sortValue: (row) => row.occupationSnapshot,
      render: (row) => row.occupationSnapshot,
    },
    {
      key: "source",
      header: "Source",
      render: (row) => (row.source === "qr" ? "Door QR" : "Manual"),
    },
    {
      key: "device",
      header: "Device",
      render: (row) => row.deviceCategory,
    },
    {
      key: "duplicate",
      header: "State",
      render: (row) =>
        row.duplicate ? (
          <span className="font-semibold text-red-deep">Duplicate</span>
        ) : (
          "Recorded"
        ),
    },
    {
      key: "time",
      header: "Checked in",
      sortValue: (row) => row.checkedInAt,
      render: (row) => formatDateTime(row.checkedInAt),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Attendance"
        description="Live door totals. RSVP is not presence."
        actions={
          <Button
            type="button"
            className="bg-red text-white hover:bg-red-deep"
            onClick={() => setOpen(true)}
          >
            Manual check-in
          </Button>
        }
      />

      {banner ? (
        <p className="border border-border bg-white px-4 py-3 text-sm" role="status">
          {banner}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Checked in" value={rows.length} hint={hasLiveData ? "This edition" : "None yet"} />
        <Metric label="Attending RSVPs" value={attending} hint="Intent only" />
        <Metric label="Duplicates" value={rows.filter((row) => row.duplicate).length} />
      </div>

      <Surface>
        <AttendanceQr edition={edition} />
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface title="Occupation breakdown">
          {occupationItems.length ? (
            <BarList items={occupationItems} />
          ) : (
            <p className="text-sm text-muted">Occupation bars appear after the first check-ins.</p>
          )}
        </Surface>
        <Surface title="Hourly trend">
          {hourlyItems.length ? (
            <HourlyBars items={hourlyItems} />
          ) : (
            <p className="text-sm text-muted">Hourly trend will populate on event day.</p>
          )}
        </Surface>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search guest or occupation"
        searchFilter={(row, q) =>
          `${row.guest} ${row.occupationSnapshot}`.toLowerCase().includes(q)
        }
        emptyTitle="No check-ins yet"
        emptyBody="When doors open, QR and manual records will list here."
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Manual check-in"
        description="Use when a guest cannot scan."
        footer={
          <Button
            type="button"
            className="w-full bg-red text-white hover:bg-red-deep"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const result = await adminCheckIn({
                eventId: edition.id,
                fullName: name,
                email,
                phone,
                occupation,
                consentAttendance: true,
                consentReminders: false,
              });
              setSaving(false);
              if (result.status === "success" || result.status === "duplicate") {
                setBanner(
                  result.status === "duplicate"
                    ? `${name || "Guest"} was already checked in.`
                    : `Recorded ${name || "guest"} at the desk.`,
                );
                setOpen(false);
                setName("");
                setEmail("");
                setPhone("");
                setOccupation("");
                await refresh();
                return;
              }
              setBanner("message" in result ? result.message : "Check-in could not be saved.");
            }}
          >
            Record attendance
          </Button>
        }
      >
        <div className="grid gap-4">
          <Field id="m-name" label="Full name">
            <TextInput id="m-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field id="m-email" label="Email">
            <TextInput
              id="m-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field id="m-phone" label="WhatsApp">
            <PhoneField id="m-phone" value={phone} onChange={setPhone} />
          </Field>
          <Field id="m-occ" label="Occupation">
            <TextInput
              id="m-occ"
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
            />
          </Field>
          <p className="text-xs text-muted">
            Match against {contacts.length} known contacts when possible.
          </p>
        </div>
      </Drawer>
    </div>
  );
}
