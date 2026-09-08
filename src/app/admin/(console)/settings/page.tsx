"use client";

import { useState } from "react";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader, Surface } from "@/components/admin/page-header";
import { WhatsAppSessionCard } from "@/components/admin/whatsapp-session";
import { StatusDot } from "@/components/ui/status-badge";
import { useAdminData } from "@/components/admin/admin-data";
import { SITE } from "@/data/site";
import { labelRole } from "@/lib/admin";
import type { WhatsAppSessionStatus } from "@/types";

const SESSION_STATES: WhatsAppSessionStatus[] = [
  "connected",
  "disconnected",
  "qr_required",
  "connecting",
  "degraded",
  "rate_limited",
];

export default function AdminSettingsPage() {
  const { adminUsers, whatsappSession } = useAdminData();
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
  const [status, setStatus] = useState<WhatsAppSessionStatus>(session.status);
  const [displayName, setDisplayName] = useState(session.displayName);
  const [minDelayMs, setMinDelayMs] = useState("8000");
  const [concurrency, setConcurrency] = useState("1");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Settings"
        description="Users, sender identity and the dedicated WhatsApp session."
      />

      <Surface title="Users and roles">
        <ul className="grid gap-3">
          {adminUsers.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-semibold text-ink">{user.name}</p>
                <p className="text-muted">{user.email}</p>
              </div>
              <p className="text-muted">
                {labelRole(user.role)} / {user.status}
              </p>
            </li>
          ))}
        </ul>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface title="Verified email sender (mock)">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">From</dt>
              <dd>{SITE.contactEmail}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd>
                <StatusDot tone="ok" label="Verified (mock)" />
              </dd>
            </div>
          </dl>
        </Surface>
        <Surface title="WhatsApp provider">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Provider</dt>
              <dd>OpenWA</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Dedicated number</dt>
              <dd>{session.maskedPhone}</dd>
            </div>
            <Field id="wa-name" label="Display name">
              <TextInput
                id="wa-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </Field>
          </dl>
        </Surface>
      </div>

      <Surface
        title="OpenWA session"
        action={
          <SelectInput
            id="session-state"
            className="w-44"
            buttonClassName="h-8 rounded-sm px-3 text-sm"
            value={status}
            onValueChange={(value) => setStatus(value as WhatsAppSessionStatus)}
            aria-label="Session state"
            options={SESSION_STATES.map((item) => ({
              value: item,
              label: item.replaceAll("_", " "),
            }))}
          />
        }
      >
        <WhatsAppSessionCard session={{ ...session, displayName }} status={status} />
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface title="Pacing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="pace" label="Min delay (ms)">
              <TextInput
                id="pace"
                value={minDelayMs}
                onChange={(event) => setMinDelayMs(event.target.value)}
              />
            </Field>
            <Field id="conc" label="Concurrency">
              <TextInput
                id="conc"
                value={concurrency}
                onChange={(event) => setConcurrency(event.target.value)}
              />
            </Field>
          </div>
          <p className="mt-3 text-sm text-muted">
            Mock policy: {minDelayMs}ms between messages, concurrency {concurrency}.
          </p>
        </Surface>
        <Surface title="Fallback behavior">
          <p className="text-sm text-muted">
            If WhatsApp does not accept a message within 30 minutes, email copy is queued for
            anyone with email consent. This is the mock policy only.
          </p>
        </Surface>
      </div>

      <Surface title="Integration health">
        <ul className="grid gap-2 text-sm">
          <li className="flex justify-between">
            <span>Public site</span>
            <StatusDot tone="ok" label="Reachable" />
          </li>
          <li className="flex justify-between">
            <span>Email sender</span>
            <StatusDot tone="ok" label="Verified (mock)" />
          </li>
          <li className="flex justify-between">
            <span>OpenWA worker</span>
            <StatusDot
              tone={status === "connected" ? "ok" : status === "connecting" ? "idle" : "warn"}
              label={status.replaceAll("_", " ")}
            />
          </li>
          <li className="flex justify-between">
            <span>Database</span>
            <StatusDot tone="idle" label="Not wired (frontend mock)" />
          </li>
        </ul>
      </Surface>
    </div>
  );
}
