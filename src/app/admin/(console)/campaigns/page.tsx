"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClock, FileUp, Mail, MessageCircle, Search, Send, Users } from "lucide-react";
import { scheduleCampaignAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { inEdition, labelCampaignStatus, labelChannel } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";
import type { Campaign, CampaignChannelMode, Contact, MessageAttachment } from "@/types";

const EMOJIS = ["🙌", "🔥", "✨", "🙏", "🎶", "📍", "🕊️", "❤️"];
const AUDIENCES = [
  { value: "All registered users", label: "All registered users" },
  { value: "All attendees", label: "All attendees" },
  { value: "Specific targeted users", label: "Specific targeted users" },
];

type Draft = {
  name: string;
  subject: string;
  channelMode: CampaignChannelMode;
  audienceLabel: string;
  whatsappBody: string;
  emailBody: string;
  scheduledAt: string;
  sendNow: boolean;
  targetContactIds: string[];
  attachments: MessageAttachment[];
};

const emptyDraft = (): Draft => ({
  name: "",
  subject: "",
  channelMode: "both",
  audienceLabel: "All attendees",
  whatsappBody: "",
  emailBody: "",
  scheduledAt: "",
  sendNow: true,
  targetContactIds: [],
  attachments: [],
});

function localDateTimeToIso(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function contactLabel(contact: Contact) {
  return `${contact.firstName} ${contact.lastName}`.trim() || contact.email || contact.phone;
}

export default function AdminCampaignsPage() {
  const { edition } = useEdition();
  const { campaigns, contacts, refresh } = useAdminData();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () => campaigns.filter((row) => inEdition(row.eventId, edition)),
    [campaigns, edition],
  );
  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts.slice(0, 8);
    return contacts
      .filter((contact) =>
        `${contact.firstName} ${contact.lastName} ${contact.email ?? ""} ${contact.phone}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 12);
  }, [contacts, query]);

  const selectedContacts = contacts.filter((contact) => draft.targetContactIds.includes(contact.id));
  const usingEmail = draft.channelMode !== "whatsapp";
  const usingWhatsApp = draft.channelMode !== "email";

  const columns: DataTableColumn<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      sortValue: (row) => row.name,
      render: (row) => row.name,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => labelCampaignStatus(row.status),
    },
    {
      key: "channel",
      header: "Channel",
      render: (row) => labelChannel(row.channelMode === "fallback" ? "both" : row.channelMode),
    },
    { key: "audience", header: "Audience", render: (row) => row.audienceLabel },
    {
      key: "eligible",
      header: "Delivery",
      sortValue: (row) => row.eligibleCount,
      render: (row) => `${row.sentCount ?? 0} sent / ${row.failedCount ?? 0} failed`,
    },
    {
      key: "when",
      header: "Schedule",
      sortValue: (row) => row.scheduledAt ?? "",
      render: (row) => (row.scheduledAt ? formatDateTime(row.scheduledAt) : "Draft"),
    },
  ];

  const appendEmoji = (emoji: string) => {
    const field = usingWhatsApp ? "whatsappBody" : "emailBody";
    setDraft((current) => ({ ...current, [field]: `${current[field]}${emoji}` }));
  };

  const toggleContact = (id: string) => {
    setDraft((current) => ({
      ...current,
      targetContactIds: current.targetContactIds.includes(id)
        ? current.targetContactIds.filter((item) => item !== id)
        : [...current.targetContactIds, id],
      audienceLabel: "Specific targeted users",
    }));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const allowed = new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    const next: MessageAttachment[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      if (!allowed.has(file.type)) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      next.push({ name: file.name, contentType: file.type, size: file.size, dataUrl });
    }
    setDraft((current) => ({ ...current, attachments: [...current.attachments, ...next].slice(0, 4) }));
  };

  const submit = () => {
    setBanner(null);
    setErrors({});
    startTransition(async () => {
      const result = await scheduleCampaignAction({
        eventId: edition.id,
        name: draft.name,
        subject: draft.subject,
        channelMode: draft.channelMode,
        audienceLabel: draft.audienceLabel,
        whatsappBody: draft.whatsappBody,
        emailBody: draft.emailBody,
        scheduledAt: draft.sendNow ? undefined : localDateTimeToIso(draft.scheduledAt),
        targetContactIds: draft.audienceLabel === "Specific targeted users" ? draft.targetContactIds : [],
        attachments: draft.attachments,
      });

      if (result.status === "success") {
        setBanner(draft.sendNow ? "Campaign queued and dispatch started." : "Campaign scheduled.");
        setDraft(emptyDraft());
        await refresh();
        return;
      }
      if ("errors" in result && Array.isArray(result.errors)) {
        setErrors(Object.fromEntries(result.errors.map((error) => [error.field, error.message])));
        setBanner("Review the highlighted fields.");
        return;
      }
      setBanner(result.message ?? "Campaign could not be scheduled.");
    });
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Campaigns"
        description="Schedule targeted WhatsApp and email broadcasts from the admin console."
      />
      {banner ? (
        <p className="border border-border bg-white px-4 py-3 text-sm" role="status">
          {banner}
        </p>
      ) : null}

      <section className="grid gap-5 border border-border bg-white p-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="campaign-title" label="Title" error={errors.name}>
              <TextInput
                id="campaign-title"
                value={draft.name}
                error={errors.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
            <Field id="campaign-subject" label="Subject line" error={errors.subject}>
              <TextInput
                id="campaign-subject"
                value={draft.subject}
                error={errors.subject}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-3">
            <span className="text-sm font-semibold text-ink">Delivery channels</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                { value: "email", label: "Email", icon: Mail },
                { value: "both", label: "Both", icon: Send },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      draft.channelMode === option.value ? "border-red bg-red-soft text-red-deep" : "border-border"
                    }`}
                    onClick={() => setDraft({ ...draft, channelMode: option.value as CampaignChannelMode })}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {usingWhatsApp ? (
            <Field id="campaign-whatsapp" label="WhatsApp body" error={errors.whatsappBody}>
              <TextArea
                id="campaign-whatsapp"
                value={draft.whatsappBody}
                error={errors.whatsappBody}
                className="min-h-40"
                onChange={(event) => setDraft({ ...draft, whatsappBody: event.target.value })}
              />
            </Field>
          ) : null}
          {usingEmail ? (
            <Field id="campaign-email" label="Email body" error={errors.emailBody}>
              <TextArea
                id="campaign-email"
                value={draft.emailBody}
                error={errors.emailBody}
                className="min-h-40"
                onChange={(event) => setDraft({ ...draft, emailBody: event.target.value })}
              />
            </Field>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="h-9 w-9 rounded-md border border-border bg-paper text-lg"
                onClick={() => appendEmoji(emoji)}
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <Field id="campaign-audience" label="Audience">
            <SelectInput
              id="campaign-audience"
              value={draft.audienceLabel}
              onValueChange={(value) => setDraft({ ...draft, audienceLabel: value })}
              options={AUDIENCES}
            />
          </Field>

          {draft.audienceLabel === "Specific targeted users" ? (
            <div className="grid gap-3 border border-border bg-paper p-3">
              <label className="flex h-11 items-center gap-2 rounded-md border border-border bg-white px-3">
                <Search className="h-4 w-4 text-muted" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search people"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <div className="grid max-h-56 gap-1 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <label key={contact.id} className="flex items-center gap-2 bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.targetContactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                    />
                    <span className="min-w-0 truncate">{contactLabel(contact)}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted">{selectedContacts.length} selected</p>
            </div>
          ) : null}

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Scheduling</span>
            <label className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
              <input
                type="radio"
                checked={draft.sendNow}
                onChange={() => setDraft({ ...draft, sendNow: true })}
              />
              <Send className="h-4 w-4" aria-hidden="true" />
              Send immediately
            </label>
            <label className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
              <input
                type="radio"
                checked={!draft.sendNow}
                onChange={() => setDraft({ ...draft, sendNow: false })}
              />
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Schedule for later
            </label>
            {!draft.sendNow ? (
              <TextInput
                id="campaign-scheduled"
                type="datetime-local"
                value={draft.scheduledAt}
                onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })}
              />
            ) : null}
          </div>

          <label className="grid gap-2 border border-dashed border-border bg-paper p-4 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Attach files
            </span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => void onFiles(event.target.files)}
            />
            {draft.attachments.length ? (
              <ul className="grid gap-1 text-xs text-muted">
                {draft.attachments.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            ) : null}
          </label>

          <div className="border border-border bg-paper p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4" aria-hidden="true" />
              Estimated audience
            </p>
            <p className="mt-2 text-muted">
              {draft.audienceLabel === "Specific targeted users"
                ? `${selectedContacts.length} selected recipients`
                : draft.audienceLabel}
            </p>
          </div>

          <Button type="button" className="bg-red text-white hover:bg-red-deep" disabled={isPending} onClick={submit}>
            {isPending ? "Queuing..." : draft.sendNow ? "Send now" : "Schedule campaign"}
          </Button>
        </aside>
      </section>

      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search campaign or audience"
        searchFilter={(row, q) =>
          `${row.name} ${row.audienceLabel} ${row.status}`.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
