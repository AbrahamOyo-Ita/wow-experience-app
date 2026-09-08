"use client";

import { BarList, FunnelChart } from "@/components/admin/chart";
import { EmptyState } from "@/components/admin/empty-state";
import { Metric, PageHeader, Surface } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { inEdition } from "@/lib/admin";

export default function AdminAnalyticsPage() {
  const { edition } = useEdition();
  const { rsvps, attendance, volunteers, campaigns, loading } = useAdminData();
  const attending = rsvps.filter(
    (row) => inEdition(row.eventId, edition) && row.response === "attending",
  ).length;
  const matched = attendance.filter((row) => inEdition(row.eventId, edition)).length;
  const rate = attending ? Math.round((matched / attending) * 1000) / 10 : 0;
  const empty = !loading && attending === 0 && matched === 0 && edition.year === 2027;
  const pipeline = volunteers.filter((row) => inEdition(row.eventId, edition));
  const funnel = [
    { label: "RSVPs", value: rsvps.filter((row) => inEdition(row.eventId, edition)).length },
    { label: "Attending", value: attending },
    { label: "Matched attendance", value: matched },
  ];
  const occupation = Array.from(
    attendance
      .filter((row) => inEdition(row.eventId, edition))
      .reduce((map, row) => {
        const label = row.occupationSnapshot || "Unspecified";
        map.set(label, (map.get(label) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
  ).map(([label, value]) => ({ label, value }));
  const volunteerPipeline = [
    { label: "Submitted", value: pipeline.filter((row) => row.status === "submitted").length },
    { label: "Under review", value: pipeline.filter((row) => row.status === "under_review").length },
    { label: "Accepted", value: pipeline.filter((row) => row.status === "accepted").length },
    { label: "Waitlisted", value: pipeline.filter((row) => row.status === "waitlisted").length },
    { label: "Declined", value: pipeline.filter((row) => row.status === "declined").length },
  ];
  const campaignDelivery = [
    { label: "Scheduled", value: campaigns.filter((row) => row.status === "scheduled").length },
    { label: "Sent", value: campaigns.reduce((sum, row) => sum + (row.sentCount ?? 0), 0) },
    { label: "Delivered", value: campaigns.reduce((sum, row) => sum + (row.deliveredCount ?? 0), 0) },
    { label: "Failed", value: campaigns.reduce((sum, row) => sum + (row.failedCount ?? 0), 0) },
  ];

  if (empty) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Analytics"
          description="Funnel and conversion for the selected edition."
        />
        <EmptyState
          title="No analytics yet"
          body="This edition has no public traffic yet. Publish it, then RSVP and door scans will fill this view."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Analytics"
        description="Counts from live RSVPs, attendance, volunteers and campaigns."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Attending RSVPs" value={attending} />
        <Metric label="Matched attendance" value={matched} hint="Door scans for this edition" />
        <Metric label="RSVP to attendance" value={`${rate}%`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface title="Traffic funnel">
          <FunnelChart items={funnel} />
        </Surface>
        <Surface title="Occupation">
          <BarList items={occupation.length ? occupation : [{ label: "No scans", value: 0 }]} tone="ink" />
        </Surface>
        <Surface title="Volunteer pipeline">
          <BarList items={volunteerPipeline} />
        </Surface>
        <Surface title="Campaign channel metrics">
          <BarList items={campaignDelivery} tone="ink" />
        </Surface>
      </div>
    </div>
  );
}
