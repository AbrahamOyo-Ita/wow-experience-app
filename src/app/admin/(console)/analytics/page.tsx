"use client";

import { useEffect, useState, useTransition } from "react";
import { loadAnalyticsSnapshot, type AnalyticsSnapshot } from "@/actions/analytics";
import { BarList, FunnelChart, TrendSparkline } from "@/components/admin/chart";
import { Metric, PageHeader, Surface } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { inEdition } from "@/lib/admin";

const ranges = [7, 30, 90, 365] as const;

export default function AdminAnalyticsPage() {
  const { edition } = useEdition();
  const { rsvps, attendance, volunteers, campaigns } = useAdminData();
  const [days, setDays] = useState(30);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      const result = await loadAnalyticsSnapshot(days);
      if (!active) return;
      if (result.status === "success") {
        setSnapshot(result.data);
        setError(null);
      } else {
        setSnapshot(null);
        setError(result.message);
      }
    });
    return () => {
      active = false;
    };
  }, [days]);

  const attending = rsvps.filter(
    (row) => inEdition(row.eventId, edition) && row.response === "attending",
  ).length;
  const matched = attendance.filter((row) => inEdition(row.eventId, edition)).length;
  const attendanceRate = attending ? Math.round((matched / attending) * 1000) / 10 : 0;
  const pipeline = volunteers.filter((row) => inEdition(row.eventId, edition));
  const campaignDelivery = [
    { label: "Accepted by provider", value: campaigns.reduce((sum, row) => sum + (row.sentCount ?? 0), 0) },
    { label: "Delivered", value: campaigns.reduce((sum, row) => sum + (row.deliveredCount ?? 0), 0) },
    { label: "Failed", value: campaigns.reduce((sum, row) => sum + (row.failedCount ?? 0), 0) },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Analytics"
        description="First-party website traffic, visitor geography, acquisition and event conversion. Location depends on hosting geo headers."
        actions={
          <div className="flex border border-border bg-white" aria-label="Analytics date range">
            {ranges.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={`px-3 py-2 text-xs font-semibold ${days === range ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
              >
                {range === 365 ? "1 year" : `${range} days`}
              </button>
            ))}
          </div>
        }
      />

      {error ? <div className="border border-red/30 bg-red/5 p-4 text-sm text-red" role="alert">{error}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Unique visitors" value={pending ? "…" : (snapshot?.visitors ?? 0)} />
        <Metric label="Page views" value={pending ? "…" : (snapshot?.pageViews ?? 0)} />
        <Metric label="Sessions" value={pending ? "…" : (snapshot?.sessions ?? 0)} />
        <Metric label="Views / session" value={snapshot?.viewsPerSession ?? 0} />
        <Metric label="Bounce rate" value={`${snapshot?.bounceRate ?? 0}%`} />
        <Metric label="Live now" value={snapshot?.liveVisitors ?? 0} hint="Last 5 minutes" />
      </div>

      <Surface title="Traffic trend">
        <TrendSparkline
          values={(snapshot?.daily ?? []).map((item) => item.views)}
          labels={(snapshot?.daily ?? []).length ? [snapshot!.daily[0].date, snapshot!.daily.at(-1)!.date] : undefined}
        />
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Surface title="Top pages"><BarList items={snapshot?.topPages ?? []} tone="ink" /></Surface>
        <Surface title="Countries"><BarList items={snapshot?.countries ?? []} /></Surface>
        <Surface title="Cities"><BarList items={snapshot?.cities ?? []} tone="ink" /></Surface>
        <Surface title="Traffic sources"><BarList items={snapshot?.sources ?? []} /></Surface>
        <Surface title="Referrers"><BarList items={snapshot?.referrers ?? []} tone="ink" /></Surface>
        <Surface title="Devices"><BarList items={snapshot?.devices ?? []} /></Surface>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface title={`${edition.year} event funnel`}>
          <FunnelChart items={[
            { label: "RSVPs", value: rsvps.filter((row) => inEdition(row.eventId, edition)).length },
            { label: "Attending", value: attending },
            { label: "Checked in", value: matched },
          ]} />
          <p className="mt-3 text-xs text-muted">RSVP-to-attendance conversion: {attendanceRate}%</p>
        </Surface>
        <Surface title="Volunteer pipeline">
          <BarList items={[
            { label: "Submitted", value: pipeline.filter((row) => row.status === "submitted").length },
            { label: "Under review", value: pipeline.filter((row) => row.status === "under_review").length },
            { label: "Accepted", value: pipeline.filter((row) => row.status === "accepted").length },
            { label: "Waitlisted", value: pipeline.filter((row) => row.status === "waitlisted").length },
            { label: "Declined", value: pipeline.filter((row) => row.status === "declined").length },
          ]} />
        </Surface>
        <Surface title="Campaign delivery"><BarList items={campaignDelivery} tone="ink" /></Surface>
      </div>
    </div>
  );
}
