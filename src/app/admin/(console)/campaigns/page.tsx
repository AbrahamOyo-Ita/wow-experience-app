"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { PageHeader } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { TEMPLATE_VARIABLES } from "@/data/admin";
import { inEdition, labelCampaignStatus, labelChannel } from "@/lib/admin";
import { campaignService } from "@/services";
import { formatDateTime } from "@/lib/utils";
import type { Campaign, CampaignChannelMode } from "@/types";

const STEPS = [
  "Channel",
  "Audience",
  "Subject",
  "WhatsApp",
  "Email",
  "Estimate",
  "Test",
  "Preview",
  "Schedule",
  "Confirm",
] as const;

type Draft = {
  channel: CampaignChannelMode;
  audience: string;
  exclusions: string;
  subject: string;
  whatsappBody: string;
  emailBody: string;
  scheduledAt: string;
};

const emptyDraft = (): Draft => ({
  channel: "both",
  audience: "Attending RSVPs with consent",
  exclusions: "Revoked consent, test numbers, declined RSVPs",
  subject: "",
  whatsappBody: "",
  emailBody: "",
  scheduledAt: "2026-11-12T18:00",
});

export default function AdminCampaignsPage() {
  const { edition } = useEdition();
  const { campaigns } = useAdminData();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [banner, setBanner] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const rows = useMemo(
    () => campaigns.filter((row) => inEdition(row.eventId, edition)),
    [campaigns, edition],
  );

  const estimate = draft.audience.includes("volunteer") ? 18 : 312;
  const excluded = draft.audience.includes("volunteer") ? 4 : 41;

  const insertVar = (field: "subject" | "whatsappBody" | "emailBody", token: string) => {
    setDraft((current) => ({ ...current, [field]: `${current[field]}{{${token}}}` }));
  };

  const sendTest = async () => {
    setTesting(true);
    const result = await campaignService.sendTest("cmp-test");
    setTesting(false);
    if (result.status === "success") {
      setBanner("Test could not be sent. Add RESEND_API_KEY or an OpenWA host first.");
    } else if ("message" in result) {
      setBanner(result.message);
    } else {
      setBanner("Test could not be sent.");
    }
  };

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
      render: (row) =>
        labelChannel(row.channelMode === "fallback" ? "both" : row.channelMode),
    },
    {
      key: "audience",
      header: "Audience",
      render: (row) => row.audienceLabel,
    },
    {
      key: "eligible",
      header: "Eligible",
      sortValue: (row) => row.eligibleCount,
      render: (row) => `${row.eligibleCount} / excl. ${row.excludedCount}`,
    },
    {
      key: "when",
      header: "Schedule",
      sortValue: (row) => row.scheduledAt ?? "",
      render: (row) => (row.scheduledAt ? formatDateTime(row.scheduledAt) : "Draft"),
    },
  ];

  const next = () => setStep((value) => Math.min(STEPS.length - 1, value + 1));
  const back = () => setStep((value) => Math.max(0, value - 1));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Campaigns"
        description="Broadcasts and tests. Nothing leaves this mock."
        actions={
          <Button
            type="button"
            className="bg-red text-white hover:bg-red-deep"
            onClick={() => {
              setDraft(emptyDraft());
              setStep(0);
              setOpen(true);
            }}
          >
            New campaign
          </Button>
        }
      />
      {banner ? (
        <p className="border border-border bg-white px-4 py-3 text-sm" role="status">
          {banner}
        </p>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search campaign or audience"
        searchFilter={(row, q) =>
          `${row.name} ${row.audienceLabel} ${row.status}`.toLowerCase().includes(q)
        }
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Compose campaign"
        description={`${STEPS[step]} (${step + 1} of ${STEPS.length})`}
        wide
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" className="bg-ink text-white hover:bg-ink/90" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-red text-white hover:bg-red-deep"
                onClick={() => {
                  setBanner("Campaign queued in the mock. No messages were sent.");
                  setOpen(false);
                }}
              >
                Confirm schedule
              </Button>
            )}
          </div>
        }
      >
        <ol className="mb-5 flex flex-wrap gap-1 text-[11px] font-semibold tracking-wide uppercase">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={index === step ? "bg-ink px-2 py-1 text-white" : "px-2 py-1 text-muted"}
            >
              {label}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Channel</legend>
            {(["whatsapp", "email", "both"] as const).map((option) => (
              <label key={option} className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
                <input
                  type="radio"
                  checked={draft.channel === option}
                  onChange={() => setDraft({ ...draft, channel: option })}
                />
                {labelChannel(option)}
              </label>
            ))}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4">
            <Field id="aud" label="Audience segment">
              <SelectInput
                id="aud"
                value={draft.audience}
                onValueChange={(value) => setDraft({ ...draft, audience: value })}
                options={[
                  {
                    value: "Attending RSVPs with consent",
                    label: "Attending RSVPs with consent",
                  },
                  { value: "Accepted volunteers", label: "Accepted volunteers" },
                  { value: "Administrators only", label: "Administrators only" },
                ]}
              />
            </Field>
            <Field id="excl" label="Exclusions">
              <TextArea
                id="excl"
                value={draft.exclusions}
                onChange={(event) => setDraft({ ...draft, exclusions: event.target.value })}
              />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <Field id="subj" label="Email subject">
            <TextInput
              id="subj"
              value={draft.subject}
              onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
            />
          </Field>
        ) : null}

        {step === 3 ? (
          <Field id="wa" label="WhatsApp message">
            <TextArea
              id="wa"
              value={draft.whatsappBody}
              onChange={(event) => setDraft({ ...draft, whatsappBody: event.target.value })}
            />
          </Field>
        ) : null}

        {step === 4 ? (
          <Field id="em" label="Email body">
            <TextArea
              id="em"
              value={draft.emailBody}
              onChange={(event) => setDraft({ ...draft, emailBody: event.target.value })}
            />
          </Field>
        ) : null}

        {step === 2 || step === 3 || step === 4 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Variables</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((token) => (
                <button
                  key={token}
                  type="button"
                  className="border border-border px-2 py-1 text-xs"
                  onClick={() =>
                    insertVar(step === 2 ? "subject" : step === 3 ? "whatsappBody" : "emailBody", token)
                  }
                >
                  {`{{${token}}}`}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Eligible</dt>
              <dd>{estimate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Excluded</dt>
              <dd>{excluded}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Channel</dt>
              <dd>{labelChannel(draft.channel === "fallback" ? "both" : draft.channel)}</dd>
            </div>
          </dl>
        ) : null}

        {step === 6 ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted">Send a test to administrators only. Mock delivery.</p>
            <Button type="button" variant="outlineDark" disabled={testing} onClick={sendTest}>
              {testing ? "Sending..." : "Send test"}
            </Button>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="grid gap-4 text-sm">
            <p className="font-semibold">{draft.subject || "No subject"}</p>
            <pre className="whitespace-pre-wrap border border-border bg-paper p-3 font-sans">
              {draft.whatsappBody || "No WhatsApp copy"}
            </pre>
            <pre className="whitespace-pre-wrap border border-border bg-paper p-3 font-sans">
              {draft.emailBody || "No email copy"}
            </pre>
          </div>
        ) : null}

        {step === 8 ? (
          <Field id="when" label="Schedule">
            <TextInput
              id="when"
              type="datetime-local"
              value={draft.scheduledAt}
              onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })}
            />
          </Field>
        ) : null}

        {step === 9 ? (
          <ul className="grid gap-2 text-sm">
            <li>Audience: {draft.audience}</li>
            <li>Exclude: {draft.exclusions}</li>
            <li>
              Recipients: {estimate} (minus {excluded})
            </li>
            <li>When: {draft.scheduledAt.replace("T", " ")}</li>
          </ul>
        ) : null}
      </Drawer>
    </div>
  );
}
