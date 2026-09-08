"use client";

import Link from "next/link";
import { BarList, HourlyBars } from "@/components/admin/chart";
import { Metric, PageHeader, Surface } from "@/components/admin/page-header";
import { WhatsAppSessionCard } from "@/components/admin/whatsapp-session";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { inEdition, labelEditionStatus } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";

export default function AdminOverviewPage() {
  const { edition } = useEdition();
  const {
    loading,
    rsvps,
    volunteers,
    campaigns,
    automations,
    auditLogs,
    whatsappSession,
    attendance,
  } = useAdminData();

  const editionRsvps = rsvps.filter((row) => inEdition(row.eventId, edition));
  const attending = editionRsvps.filter((row) => row.response === "attending").length;
  const nextCampaign =
    campaigns.find((row) => row.status === "scheduled") ?? campaigns[0];
  const pipeline = volunteers.filter((row) => inEdition(row.eventId, edition));
  const accepted = pipeline.filter((row) => row.status === "accepted").length;
  const waiting = pipeline.filter(
    (row) => row.status === "submitted" || row.status === "under_review",
  ).length;
  const thanksRule = automations.find((row) => row.triggerType === "post_event_thank_you");
  const editionAttendance = attendance.filter((row) => inEdition(row.eventId, edition));
  const rsvpByWeek = [{ label: "Live", value: attending }];
  const volunteerPipeline = [
    { label: "Submitted", value: pipeline.filter((row) => row.status === "submitted").length },
    { label: "Under review", value: pipeline.filter((row) => row.status === "under_review").length },
    { label: "Accepted", value: accepted },
    { label: "Waitlisted", value: pipeline.filter((row) => row.status === "waitlisted").length },
    { label: "Declined", value: pipeline.filter((row) => row.status === "declined").length },
  ];
  const hourly = Array.from(
    editionAttendance.reduce((map, row) => {
      const hour = new Date(row.checkedInAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      });
      map.set(hour, (map.get(hour) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([label, value]) => ({ label, value }));
  const session = whatsappSession ?? {
    id: "wow-primary",
    sessionKey: "wow-primary",
    displayName: "WOW Experience reminders",
    maskedPhone: "",
    provider: "openwa" as const,
    status: "disconnected" as const,
    lastSeenAt: null,
    lastActivity: "No session yet.",
    healthNote: "OpenWA is not connected.",
  };

  if (loading) {
    return (
      <div className="grid gap-6" aria-busy="true">
        <div className="h-20 animate-pulse bg-paper" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse border border-border bg-white" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse border border-border bg-white" />
          <div className="h-48 animate-pulse border border-border bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Overview"
        description={`${edition.name} is ${labelEditionStatus(edition.status).toLowerCase()}. RSVP is intent. Attendance is recorded at the door.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Edition"
          value={labelEditionStatus(edition.status)}
          hint={`${edition.venue.city}, ${edition.timezone}`}
        />
        <Metric label="Attending RSVPs" value={attending} hint={`${editionRsvps.length} total responses`} />
        <Metric label="Volunteer queue" value={waiting} hint={`${accepted} accepted`} />
        <Metric
          label="Next campaign"
          value={nextCampaign?.eligibleCount ?? 0}
          hint={nextCampaign?.name ?? "None scheduled"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface title="RSVP by week">
          <BarList items={rsvpByWeek} />
        </Surface>
        <Surface title="Attendance by hour">
          <HourlyBars items={hourly.length ? hourly : [{ label: "No scans", value: 0 }]} />
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface title="Volunteer pipeline">
          <BarList items={volunteerPipeline} tone="ink" />
        </Surface>
        <WhatsAppSessionCard session={session} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface
          title="Next campaign"
          action={
            <Link href="/admin/campaigns" className="text-sm font-semibold text-red">
              Open campaigns
            </Link>
          }
        >
          {nextCampaign ? (
            <dl className="grid gap-2 text-sm">
              <Row label="Name" value={nextCampaign.name} />
              <Row label="Audience" value={nextCampaign.audienceLabel} />
              <Row
                label="Eligible"
                value={`${nextCampaign.eligibleCount} (exclude ${nextCampaign.excludedCount})`}
              />
              <Row
                label="Schedule"
                value={
                  nextCampaign.scheduledAt
                    ? formatDateTime(nextCampaign.scheduledAt)
                    : "Not scheduled"
                }
              />
            </dl>
          ) : (
            <p className="text-sm text-muted">No campaign in this edition.</p>
          )}
        </Surface>
        <Surface
          title="Recent audit"
          action={
            <Link href="/admin/audit" className="text-sm font-semibold text-red">
              Full log
            </Link>
          }
        >
          <ul className="grid gap-3">
            {auditLogs.slice(0, 5).map((log) => (
              <li key={log.id} className="text-sm">
                <p className="font-semibold text-ink">{log.action}</p>
                <p className="text-muted">
                  {log.actorName} / {formatDateTime(log.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      {thanksRule && !thanksRule.enabled ? (
        <p className="border border-border bg-white px-4 py-3 text-sm text-muted">
          Post-event thank-you automation is off for this edition.
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
