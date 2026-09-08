"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { Drawer } from "@/components/admin/drawer";
import { PageHeader } from "@/components/admin/page-header";
import { AttendanceQr } from "@/components/admin/attendance-qr";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { editions } from "@/data/editions";
import { faqs } from "@/data/faqs";
import { ministers } from "@/data/ministers";
import { labelEditionStatus } from "@/lib/admin";
import { editionService } from "@/services";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import type { EventEdition } from "@/types";

export default function AdminEventsPage() {
  const { setYear } = useEdition();
  const { editions: liveEditions } = useAdminData();
  const [list, setList] = useState<EventEdition[]>(editions);
  const [editing, setEditing] = useState<EventEdition | null>(null);
  const [qr, setQr] = useState<EventEdition | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!liveEditions.length) return undefined;
    const id = window.setTimeout(() => setList(liveEditions), 0);
    return () => window.clearTimeout(id);
  }, [liveEditions]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const result = await editionService.save(editing);
    setSaving(false);
    if (result.status === "success") {
      setList((rows) => {
        const exists = rows.some((row) => row.id === editing.id);
        if (exists) return rows.map((row) => (row.id === editing.id ? editing : row));
        return [...rows, editing];
      });
      setBanner("Edition saved.");
      setEditing(null);
    } else if ("message" in result) {
      setBanner(result.message);
    }
  };

  const ministerCount = (edition: EventEdition) =>
    ministers.filter((row) => row.editionId === edition.id).length || ministers.length;

  const faqCount = (edition: EventEdition) =>
    faqs.filter((row) => row.editionId === edition.id || row.editionId === null).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Events"
        description="Editions, publish state, reminders and the door QR that points at check-in."
        actions={
          <Button
            type="button"
            className="bg-ink text-white hover:bg-ink/90"
            onClick={() =>
              setEditing({
                ...editions[0],
                id: `edition-new-${Date.now()}`,
                year: 2028,
                name: "New edition",
                shortName: "WOW draft",
                slug: "draft",
                status: "draft",
                timezone: "Africa/Lagos",
                attendanceUrl: "/attend/draft",
                qrTargetUrl: "/attend/draft",
              })
            }
          >
            New edition
          </Button>
        }
      />

      {banner ? (
        <p className="border border-border bg-white px-4 py-3 text-sm" role="status">
          {banner}
        </p>
      ) : null}

      <ul className="grid gap-3">
        {list.map((edition) => (
          <li key={edition.id} className="border border-border bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {labelEditionStatus(edition.status)}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">{edition.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {formatEventDate(edition.startsAt, edition.timezone)},{" "}
                  {formatEventTime(edition.startsAt, edition.timezone)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {edition.venue.name}, {edition.venue.city}. {edition.timezone}.
                </p>
                <p className="mt-2 text-sm text-muted">
                  Reminders: two-day {edition.reminderTwoDayEnabled ? "on" : "off"}, event-day{" "}
                  {edition.reminderEventDayEnabled
                    ? `on at ${edition.reminderEventDayTime}`
                    : "off"}
                  .
                </p>
                <p className="mt-2 text-sm text-muted">
                  Ministers: {ministerCount(edition)}. FAQ: {faqCount(edition)}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outlineDark"
                  onClick={() => {
                    setYear(edition.year);
                    setEditing(edition);
                  }}
                >
                  Edit
                </Button>
                <Button type="button" variant="outlineDark" onClick={() => setQr(edition)}>
                  QR preview
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={
          editing?.status === "draft" && editing?.id.includes("new")
            ? "Create edition"
            : "Edit edition"
        }
        description="Mock save only. Dates stay in Africa/Lagos."
        wide
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red text-white hover:bg-red-deep"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {editing ? (
          <div className="grid gap-4">
            <Field id="ed-name" label="Name">
              <TextInput
                id="ed-name"
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
            </Field>
            <Field id="ed-theme" label="Theme">
              <TextInput
                id="ed-theme"
                value={editing.theme}
                onChange={(event) => setEditing({ ...editing, theme: event.target.value })}
              />
            </Field>
            <Field id="ed-status" label="Publish state">
              <SelectInput
                id="ed-status"
                value={editing.status}
                onValueChange={(value) =>
                  setEditing({ ...editing, status: value as EventEdition["status"] })
                }
                options={["draft", "scheduled", "published", "live", "completed", "archived"].map(
                  (status) => ({ value: status, label: status }),
                )}
              />
            </Field>
            <Field id="ed-tz" label="Timezone">
              <TextInput id="ed-tz" value={editing.timezone} readOnly />
            </Field>
            <Field id="ed-venue" label="Venue">
              <TextInput
                id="ed-venue"
                value={editing.venue.name}
                onChange={(event) =>
                  setEditing({ ...editing, venue: { ...editing.venue, name: event.target.value } })
                }
              />
            </Field>
            <Field id="ed-address" label="Address">
              <TextArea
                id="ed-address"
                value={editing.venue.address}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    venue: { ...editing.venue, address: event.target.value },
                  })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.reminderTwoDayEnabled}
                onChange={(event) =>
                  setEditing({ ...editing, reminderTwoDayEnabled: event.target.checked })
                }
              />
              Two-day reminder
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.reminderEventDayEnabled}
                onChange={(event) =>
                  setEditing({ ...editing, reminderEventDayEnabled: event.target.checked })
                }
              />
              Event-day reminder at {editing.reminderEventDayTime}
            </label>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(qr)}
        onClose={() => setQr(null)}
        title="Door QR"
        description="Print this mark for stewards. It opens the public check-in page."
      >
        {qr ? (
          <AttendanceQr edition={qr} />
        ) : null}
      </Drawer>
    </div>
  );
}
