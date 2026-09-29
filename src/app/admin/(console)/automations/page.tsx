"use client";

import { useMemo, useState, useTransition } from "react";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import {
  toggleAutomationAction,
  scheduleCustomAutomationAction,
  toggleCustomAutomationAction,
  triggerCustomAutomationNowAction,
  deleteCustomAutomationAction,
} from "@/actions/admin";
import { inEdition, labelChannel } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";
import type { AutomationRule, Campaign, CampaignChannelMode } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import {
  CalendarClock,
  Clock,
  Mail,
  MessageCircle,
  Play,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Eye,
  Check,
} from "lucide-react";

type AutomationRow =
  | {
      kind: "system";
      id: string;
      eventId: string;
      name: string;
      trigger: string;
      channelMode: CampaignChannelMode;
      nextRunAt: string | null;
      lastRunAt: string | null;
      lastRunStatus: string | null;
      enabled: boolean;
      systemRule: AutomationRule;
    }
  | {
      kind: "custom";
      id: string;
      eventId: string;
      name: string;
      trigger: string;
      audienceLabel: string;
      subject: string | null;
      channelMode: CampaignChannelMode;
      nextRunAt: string | null;
      lastRunAt: string | null;
      lastRunStatus: string | null;
      status: Campaign["status"];
      enabled: boolean;
      sentCount: number;
      failedCount: number;
      campaign: Campaign;
    };

const AUDIENCE_OPTIONS = [
  { value: "All attendees", label: "All attendees (RSVP attending)" },
  { value: "All approved volunteers", label: "All approved volunteers (All teams)" },
  { value: "Volunteers: Choir & Worship Team", label: "Volunteers: Choir & Worship Team" },
  { value: "Volunteers: Media & Technical", label: "Volunteers: Media & Technical" },
  { value: "Volunteers: Ushering & Protocol", label: "Volunteers: Ushering & Protocol" },
  { value: "Volunteers: Prayer & Intercession", label: "Volunteers: Prayer & Intercession" },
  { value: "Volunteers: Hospitality & Welfare", label: "Volunteers: Hospitality & Welfare" },
  { value: "All registered contacts", label: "All registered contacts in directory" },
  { value: "Specific targeted contacts", label: "Specific targeted contacts (manual pick)" },
];

const CHANNEL_OPTIONS = [
  { value: "both", label: "WhatsApp + Email (Recommended)" },
  { value: "whatsapp", label: "WhatsApp Only" },
  { value: "email", label: "Email Only" },
  { value: "fallback", label: "WhatsApp with Email Fallback" },
];

const VARIABLE_TOKENS = [
  { token: "{{first_name}}", label: "First Name" },
  { token: "{{event_name}}", label: "Event Name" },
  { token: "{{event_date}}", label: "Event Date" },
  { token: "{{event_time}}", label: "Event Time" },
  { token: "{{venue}}", label: "Venue Name" },
  { token: "{{directions_url}}", label: "Directions Link" },
];

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminAutomationsPage() {
  const { edition } = useEdition();
  const { automations, campaigns, contacts, refresh } = useAdminData();
  const [filterTab, setFilterTab] = useState<"all" | "system" | "custom" | "active">("all");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Schedule modal form state
  const [name, setName] = useState("");
  const [audienceLabel, setAudienceLabel] = useState("All attendees");
  const [channelMode, setChannelMode] = useState<CampaignChannelMode>("both");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendNow, setSendNow] = useState(false);
  const [targetContactIds, setTargetContactIds] = useState<string[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [previewTab, setPreviewTab] = useState<"composer" | "preview">("composer");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compute timing presets based on event startsAt
  const presets = useMemo(() => {
    const startsAt = edition.startsAt ? new Date(edition.startsAt) : new Date("2026-10-18T16:00:00+01:00");
    const endsAt = edition.endsAt ? new Date(edition.endsAt) : new Date(startsAt.getTime() + 6 * 60 * 60 * 1000);

    const presetDates = [
      {
        label: "1 Week Before (09:00)",
        date: new Date(startsAt.getTime() - 7 * 24 * 60 * 60 * 1000),
        hour: 9,
      },
      {
        label: "3 Days Before (09:00)",
        date: new Date(startsAt.getTime() - 3 * 24 * 60 * 60 * 1000),
        hour: 9,
      },
      {
        label: "2 Days Before (09:00)",
        date: new Date(startsAt.getTime() - 2 * 24 * 60 * 60 * 1000),
        hour: 9,
      },
      {
        label: "1 Day Before (09:00)",
        date: new Date(startsAt.getTime() - 1 * 24 * 60 * 60 * 1000),
        hour: 9,
      },
      {
        label: "Event Morning (07:00)",
        date: new Date(startsAt.getTime()),
        hour: 7,
      },
      {
        label: "Post-Event (+2h)",
        date: new Date(endsAt.getTime() + 2 * 60 * 60 * 1000),
        hour: null,
      },
    ];

    return presetDates.map((item) => {
      const d = new Date(item.date);
      if (item.hour !== null) {
        d.setHours(item.hour, 0, 0, 0);
      }
      return {
        label: item.label,
        value: toLocalDatetimeInput(d),
      };
    });
  }, [edition]);

  // Merge system rules and custom automations for active edition
  const rows: AutomationRow[] = useMemo(() => {
    const systemRows: AutomationRow[] = automations
      .filter((row) => inEdition(row.eventId, edition))
      .map((row) => ({
        kind: "system",
        id: row.id,
        eventId: row.eventId,
        name: row.name,
        trigger: row.triggerType.replaceAll("_", " "),
        channelMode: row.channelMode,
        nextRunAt: row.nextRunAt,
        lastRunAt: row.lastRunAt,
        lastRunStatus: row.lastRunStatus,
        enabled: row.enabled,
        systemRule: row,
      }));

    const customRows: AutomationRow[] = campaigns
      .filter((c) => inEdition(c.eventId, edition) && c.type === "automation")
      .map((c) => ({
        kind: "custom",
        id: c.id,
        eventId: c.eventId,
        name: c.name,
        trigger: c.scheduledAt ? `Scheduled (${formatDateTime(c.scheduledAt)})` : "Custom Automation",
        audienceLabel: c.audienceLabel,
        subject: c.subject,
        channelMode: c.channelMode,
        nextRunAt: c.scheduledAt,
        lastRunAt: c.completedAt ?? c.startedAt ?? null,
        lastRunStatus: c.status,
        status: c.status,
        enabled: c.status !== "cancelled",
        sentCount: c.sentCount ?? 0,
        failedCount: c.failedCount ?? 0,
        campaign: c,
      }));

    return [...systemRows, ...customRows];
  }, [automations, campaigns, edition]);

  const visibleRows = useMemo(() => {
    if (filterTab === "system") return rows.filter((r) => r.kind === "system");
    if (filterTab === "custom") return rows.filter((r) => r.kind === "custom");
    if (filterTab === "active") return rows.filter((r) => r.enabled);
    return rows;
  }, [filterTab, rows]);

  // Counts for tabs
  const counts = useMemo(
    () => ({
      all: rows.length,
      system: rows.filter((r) => r.kind === "system").length,
      custom: rows.filter((r) => r.kind === "custom").length,
      active: rows.filter((r) => r.enabled).length,
    }),
    [rows],
  );

  // Toggle switch handler
  const handleToggle = async (row: AutomationRow) => {
    if (row.kind === "system") {
      await toggleAutomationAction(row.id, !row.enabled);
    } else {
      await toggleCustomAutomationAction(row.id, !row.enabled);
    }
    await refresh();
  };

  // Run Now handler for custom automation
  const handleRunNow = (row: AutomationRow & { kind: "custom" }) => {
    if (!confirm(`Trigger custom automation "${row.name}" immediately?`)) return;
    startTransition(async () => {
      const res = await triggerCustomAutomationNowAction(row.id);
      if (res.status === "success") {
        setBanner({ type: "success", text: `Triggered "${row.name}". Dispatch in progress.` });
        await refresh();
      } else {
        setBanner({ type: "error", text: res.message || "Failed to trigger automation." });
      }
    });
  };

  // Delete handler for custom automation
  const handleDelete = (row: AutomationRow & { kind: "custom" }) => {
    if (!confirm(`Delete custom automation "${row.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteCustomAutomationAction(row.id);
      if (res.status === "success") {
        setBanner({ type: "success", text: `Deleted custom automation "${row.name}".` });
        await refresh();
      } else {
        setBanner({ type: "error", text: res.message || "Failed to delete automation." });
      }
    });
  };

  // Insert token helper
  const handleInsertToken = (token: string) => {
    setBody((prev) => (prev ? `${prev} ${token}` : token));
  };

  // Filtered contacts for picker
  const filteredContacts = useMemo(() => {
    const q = contactSearchQuery.trim().toLowerCase();
    if (!q) return contacts.slice(0, 8);
    return contacts
      .filter((c) =>
        `${c.firstName} ${c.lastName} ${c.email ?? ""} ${c.phone}`.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [contacts, contactSearchQuery]);

  // Reset form
  const resetForm = () => {
    setName("");
    setAudienceLabel("All attendees");
    setChannelMode("both");
    setSubject("");
    setBody("");
    setScheduledAt("");
    setSendNow(false);
    setTargetContactIds([]);
    setContactSearchQuery("");
    setErrors({});
    setPreviewTab("composer");
  };

  // Submit custom automation
  const handleScheduleSubmit = () => {
    setErrors({});
    startTransition(async () => {
      const res = await scheduleCustomAutomationAction({
        eventId: edition.id,
        name,
        channelMode,
        audienceLabel,
        subject: channelMode !== "whatsapp" ? subject : undefined,
        body,
        scheduledAt: sendNow ? undefined : scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        sendNow,
        targetContactIds: audienceLabel === "Specific targeted contacts" ? targetContactIds : [],
      });

      if (res.status === "success") {
        setBanner({
          type: "success",
          text: sendNow
            ? `Automation "${name}" dispatched immediately!`
            : `Automation "${name}" scheduled successfully.`,
        });
        resetForm();
        setIsScheduleOpen(false);
        await refresh();
        return;
      }

      if ("errors" in res && Array.isArray(res.errors)) {
        setErrors(Object.fromEntries(res.errors.map((e) => [e.field, e.message])));
        return;
      }

      setBanner({
        type: "error",
        text: res.message || "Failed to schedule custom automation.",
      });
    });
  };

  // Live preview rendered text
  const previewBody = useMemo(() => {
    const raw = body || "Greetings {{first_name}}, this is an automated update for {{event_name}}.";
    const startsAt = edition.startsAt ? new Date(edition.startsAt) : new Date();
    const eventDate = new Intl.DateTimeFormat("en-NG", {
      dateStyle: "long",
      timeZone: "Africa/Lagos",
    }).format(startsAt);
    const eventTime = new Intl.DateTimeFormat("en-NG", {
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(startsAt);

    return raw
      .replaceAll("{{first_name}}", "David")
      .replaceAll("{{event_name}}", edition.name || "Wonders of Worship 2026")
      .replaceAll("{{event_date}}", eventDate)
      .replaceAll("{{event_time}}", eventTime)
      .replaceAll("{{venue}}", edition.venue.name || "The Dome, Landmark Centre")
      .replaceAll(
        "{{directions_url}}",
        edition.venue.directionsUrl || "https://maps.google.com/?q=Landmark+Centre",
      );
  }, [body, edition]);

  const columns: DataTableColumn<AutomationRow>[] = [
    {
      key: "name",
      header: "Rule",
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{row.name}</span>
            {row.kind === "system" ? (
              <span className="inline-flex items-center rounded border border-border bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                System Rule
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                <Sparkles className="h-2.5 w-2.5" />
                Custom Scheduled
              </span>
            )}
          </div>
          {row.kind === "custom" && (
            <span className="text-xs text-muted">
              Audience: <span className="font-medium text-ink">{row.audienceLabel}</span>
              {row.subject ? ` • "${row.subject}"` : ""}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "trigger",
      header: "Trigger",
      render: (row) => (
        <span className="capitalize text-ink">
          {row.kind === "system" ? row.trigger : row.audienceLabel}
        </span>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.channelMode === "whatsapp" ? (
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
          ) : row.channelMode === "email" ? (
            <Mail className="h-3.5 w-3.5 text-blue-600" />
          ) : (
            <>
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              <Mail className="h-3.5 w-3.5 text-blue-600" />
            </>
          )}
          <span>
            {row.channelMode === "fallback"
              ? "WhatsApp, email fallback"
              : labelChannel(row.channelMode)}
          </span>
        </div>
      ),
    },
    {
      key: "next",
      header: "Next run",
      sortValue: (row) => row.nextRunAt ?? "",
      render: (row) =>
        row.nextRunAt ? (
          <span className="inline-flex items-center gap-1 text-ink">
            <Clock className="h-3.5 w-3.5 text-muted" />
            {formatDateTime(row.nextRunAt)}
          </span>
        ) : (
          <span className="text-muted">On trigger</span>
        ),
    },
    {
      key: "last",
      header: "Last run / Status",
      sortValue: (row) => row.lastRunAt ?? "",
      render: (row) => {
        if (row.kind === "system") {
          return row.lastRunAt
            ? `${formatDateTime(row.lastRunAt)} (${String(row.lastRunStatus ?? "unknown")})`
            : "Never";
        }
        if (row.status === "completed") {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed ({row.sentCount} sent)
            </span>
          );
        }
        if (row.status === "scheduled") {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Scheduled
            </span>
          );
        }
        if (row.status === "queueing" || row.status === "sending") {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
              <span className="h-2 w-2 animate-ping rounded-full bg-blue-600" />
              In Progress
            </span>
          );
        }
        if (row.status === "cancelled") {
          return <span className="text-xs text-stone-500">Paused / Cancelled</span>;
        }
        if (row.status === "failed") {
          return <span className="text-xs font-semibold text-rose-600">Failed</span>;
        }
        return "Never";
      },
    },
    {
      key: "enabled",
      header: "Enabled",
      render: (row) => (
        <button
          type="button"
          role="switch"
          aria-checked={row.enabled}
          className={`h-7 w-12 border transition-colors ${
            row.enabled ? "border-ink bg-ink" : "border-border bg-paper"
          }`}
          onClick={() => handleToggle(row)}
        >
          <span className="sr-only">{row.enabled ? "On" : "Off"}</span>
          <span
            className={`block h-5 w-5 bg-white transition ${
              row.enabled ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        if (row.kind === "system") {
          return <span className="text-xs text-muted">Core Rule</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Run custom automation immediately"
              onClick={() => handleRunNow(row)}
              className="inline-flex items-center gap-1 border border-border bg-white px-2 py-1 text-xs font-medium text-ink hover:bg-stone-50"
            >
              <Play className="h-3 w-3 text-emerald-600" />
              Run Now
            </button>
            <button
              type="button"
              title="Delete custom automation"
              onClick={() => handleDelete(row)}
              className="inline-flex items-center border border-transparent p-1 text-muted hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Automations"
        description="Lifecycle triggers and custom scheduled automations. Changes are persisted and scheduled runs execute through the notification worker."
        actions={
          <Button
            type="button"
            className="flex items-center gap-2 bg-ink text-white hover:bg-ink/90"
            onClick={() => {
              resetForm();
              setIsScheduleOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Schedule Automation
          </Button>
        }
      />

      {banner && (
        <div
          className={`flex items-center justify-between border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            className="text-stone-500 hover:text-ink"
            onClick={() => setBanner(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === "all"
              ? "bg-ink text-white"
              : "bg-paper text-ink border border-border hover:bg-stone-100"
          }`}
        >
          All Automations ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("system")}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === "system"
              ? "bg-ink text-white"
              : "bg-paper text-ink border border-border hover:bg-stone-100"
          }`}
        >
          System Rules ({counts.system})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("custom")}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === "custom"
              ? "bg-ink text-white"
              : "bg-paper text-ink border border-border hover:bg-stone-100"
          }`}
        >
          Custom Scheduled ({counts.custom})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("active")}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === "active"
              ? "bg-ink text-white"
              : "bg-paper text-ink border border-border hover:bg-stone-100"
          }`}
        >
          Active Only ({counts.active})
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={visibleRows}
        searchPlaceholder="Search rules, triggers, or audiences"
        searchFilter={(row, q) =>
          `${row.name} ${row.trigger} ${row.channelMode} ${
            row.kind === "custom" ? row.audienceLabel : ""
          }`
            .toLowerCase()
            .includes(q)
        }
      />

      {/* Schedule Custom Automation Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col border border-border bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  Schedule Custom Automation
                </h2>
                <p className="text-xs text-muted">
                  Create a custom scheduled automation rule for {edition.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-stone-400 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Tab Selector: Composer vs Live Preview */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setPreviewTab("composer")}
                  className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
                    previewTab === "composer"
                      ? "border-ink text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  Configure & Compose
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("preview")}
                  className={`border-b-2 px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition ${
                    previewTab === "preview"
                      ? "border-ink text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Live Preview
                </button>
              </div>

              {previewTab === "composer" ? (
                <div className="space-y-4">
                  {/* Rule Name */}
                  <Field id="automation-name" label="Automation Title / Name" error={errors.name}>
                    <TextInput
                      id="automation-name"
                      placeholder="e.g. Choir Rehearsal Protocol or 1-Week Fasting Countdown"
                      value={name}
                      error={errors.name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>

                  {/* Target Audience */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="automation-audience" label="Target Audience" error={errors.audienceLabel}>
                      <SelectInput
                        id="automation-audience"
                        value={audienceLabel}
                        onValueChange={(val) => setAudienceLabel(val)}
                        options={AUDIENCE_OPTIONS}
                      />
                    </Field>

                    {/* Delivery Channel */}
                    <Field id="automation-channel" label="Delivery Channel" error={errors.channelMode}>
                      <SelectInput
                        id="automation-channel"
                        value={channelMode}
                        onValueChange={(val) => setChannelMode(val as CampaignChannelMode)}
                        options={CHANNEL_OPTIONS}
                      />
                    </Field>
                  </div>

                  {/* Specific Targeted Contacts Selector (if selected) */}
                  {audienceLabel === "Specific targeted contacts" && (
                    <div className="rounded border border-border bg-stone-50 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">Selected Recipients ({targetContactIds.length})</span>
                        {targetContactIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setTargetContactIds([])}
                            className="text-[11px] text-rose-600 hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                        <input
                          type="text"
                          placeholder="Search contact by name, email, or phone..."
                          value={contactSearchQuery}
                          onChange={(e) => setContactSearchQuery(e.target.value)}
                          className="w-full border border-border bg-white pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink"
                        />
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {filteredContacts.map((contact) => {
                          const isSelected = targetContactIds.includes(contact.id);
                          return (
                            <label
                              key={contact.id}
                              className={`flex items-center justify-between p-1.5 text-xs cursor-pointer border ${
                                isSelected ? "border-ink bg-stone-100" : "border-border bg-white hover:bg-stone-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setTargetContactIds((prev) =>
                                      isSelected
                                        ? prev.filter((id) => id !== contact.id)
                                        : [...prev, contact.id],
                                    );
                                  }}
                                  className="h-3.5 w-3.5"
                                />
                                <span className="font-medium text-ink">
                                  {contact.firstName} {contact.lastName}
                                </span>
                              </div>
                              <span className="text-muted text-[11px]">
                                {contact.phone} {contact.email ? `• ${contact.email}` : ""}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Schedule & Timing */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                      Schedule Timing
                    </label>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-muted">Quick Event Presets (WAT):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {presets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            disabled={sendNow}
                            onClick={() => {
                              setScheduledAt(preset.value);
                              setSendNow(false);
                            }}
                            className={`px-2 py-1 text-[11px] font-medium border transition ${
                              scheduledAt === preset.value && !sendNow
                                ? "border-ink bg-ink text-white"
                                : "border-border bg-paper text-ink hover:bg-stone-100"
                            } ${sendNow ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 pt-2 sm:grid-cols-2 items-center">
                      <Field id="scheduled-at" label="Custom Date & Time (WAT)" error={errors.scheduledAt}>
                        <TextInput
                          id="scheduled-at"
                          type="datetime-local"
                          value={scheduledAt}
                          disabled={sendNow}
                          error={errors.scheduledAt}
                          onChange={(e) => {
                            setScheduledAt(e.target.value);
                            setSendNow(false);
                          }}
                        />
                      </Field>

                      <label className="flex items-center gap-2.5 pt-4 text-xs font-medium text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendNow}
                          onChange={(e) => setSendNow(e.target.checked)}
                          className="h-4 w-4 border-border text-ink"
                        />
                        <span>Send / Trigger immediately now</span>
                      </label>
                    </div>
                  </div>

                  {/* Email Subject (if applicable) */}
                  {channelMode !== "whatsapp" && (
                    <Field id="automation-subject" label="Email Subject Line" error={errors.subject}>
                      <TextInput
                        id="automation-subject"
                        placeholder="e.g. Important Update for WOW 2026"
                        value={subject}
                        error={errors.subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </Field>
                  )}

                  {/* Message Body */}
                  <Field id="automation-body" label="Message Body" error={errors.body}>
                    <TextArea
                      id="automation-body"
                      rows={5}
                      placeholder="Write your automation message here. Use template variables below for personalizing recipient details..."
                      value={body}
                      error={errors.body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </Field>

                  {/* Insert Variable Helper Tags */}
                  <div className="space-y-1.5 bg-stone-50 p-2.5 border border-border">
                    <span className="text-[11px] font-bold text-ink">Click to insert personalization variable:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {VARIABLE_TOKENS.map((token) => (
                        <button
                          key={token.token}
                          type="button"
                          onClick={() => handleInsertToken(token.token)}
                          className="px-2 py-0.5 text-[11px] font-mono border border-border bg-white text-ink hover:bg-stone-100 hover:border-ink transition"
                        >
                          {token.token} <span className="text-muted font-sans">({token.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Live Preview Tab */
                <div className="space-y-6">
                  {/* WhatsApp Preview */}
                  {(channelMode === "both" || channelMode === "whatsapp" || channelMode === "fallback") && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                        WhatsApp Message Preview
                      </span>
                      <div className="rounded-lg border border-emerald-900/10 bg-[#efeae2] p-4 shadow-inner max-w-lg">
                        <div className="flex items-center gap-2 border-b border-black/10 pb-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                            WOW
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-800 block">Wonders of Worship</span>
                            <span className="text-[10px] text-zinc-500">Official Notification</span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm border border-emerald-900/5 text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
                          {previewBody}
                          <div className="mt-2 flex justify-end items-center gap-1 text-[10px] text-zinc-400">
                            <span>12:00</span>
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Preview */}
                  {(channelMode === "both" || channelMode === "email" || channelMode === "fallback") && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Email Delivery Preview
                      </span>
                      <div className="border border-border bg-white shadow-sm max-w-lg">
                        <div className="border-b border-border bg-stone-50 p-3 text-xs space-y-1">
                          <div>
                            <span className="text-muted">From: </span>
                            <span className="font-semibold text-ink">WOW Experience &lt;noreply@wowexperience.com.ng&gt;</span>
                          </div>
                          <div>
                            <span className="text-muted">Subject: </span>
                            <span className="font-semibold text-ink">{subject || `Notification: ${edition.name}`}</span>
                          </div>
                        </div>
                        <div className="p-4 text-xs text-ink leading-relaxed whitespace-pre-wrap">
                          {previewBody}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-stone-50">
              <span className="text-xs text-muted">
                {sendNow
                  ? "Will dispatch immediately"
                  : scheduledAt
                  ? `Scheduled for ${formatDateTime(new Date(scheduledAt).toISOString())}`
                  : "Pick a date/time or send immediately"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-ink text-white hover:bg-ink/90"
                  onClick={handleScheduleSubmit}
                  disabled={isPending || !name.trim() || !body.trim()}
                >
                  {isPending ? (
                    "Processing..."
                  ) : sendNow ? (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Run Now
                    </>
                  ) : (
                    <>
                      <CalendarClock className="h-3.5 w-3.5 mr-1" />
                      Schedule Automation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
