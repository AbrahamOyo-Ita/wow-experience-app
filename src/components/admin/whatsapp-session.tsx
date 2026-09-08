"use client";

import type { WhatsAppSession, WhatsAppSessionStatus } from "@/types";
import { PlaceholderQr } from "@/components/admin/placeholder-qr";
import { StatusDot } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

const TONE: Record<WhatsAppSessionStatus, "ok" | "warn" | "bad" | "idle"> = {
  connected: "ok",
  connecting: "idle",
  degraded: "warn",
  rate_limited: "warn",
  disconnected: "bad",
  qr_required: "warn",
};

const COPY: Record<WhatsAppSessionStatus, string> = {
  connected: "Session healthy. Campaigns may send on WhatsApp.",
  connecting: "Reconnecting to the dedicated number.",
  degraded: "Delivery is slow or failing. Email remains available.",
  rate_limited: "Pacing paused after provider limits. Email remains available.",
  disconnected: "WhatsApp sends are blocked until the session is restored.",
  qr_required: "Scan the placeholder panel on the always-on host. This is not a live WhatsApp login.",
};

export function WhatsAppSessionCard({
  session,
  status,
}: {
  session: WhatsAppSession;
  status?: WhatsAppSessionStatus;
}) {
  const current = status ?? session.status;
  return (
    <section className="border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">WhatsApp session</h2>
          <p className="mt-1 text-sm text-muted">{session.displayName}</p>
        </div>
        <StatusDot tone={TONE[current]} label={current.replaceAll("_", " ")} />
      </div>
      <p className="mt-3 text-sm text-muted">{COPY[current]}</p>
      {current === "connected" ? (
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Number</dt>
            <dd>{session.maskedPhone}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Last activity</dt>
            <dd>{session.lastActivity}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Seen</dt>
            <dd>{session.lastSeenAt ? formatDateTime(session.lastSeenAt) : "Unknown"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Health</dt>
            <dd>{session.healthNote}</dd>
          </div>
        </dl>
      ) : null}
      {current === "qr_required" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
          <PlaceholderQr />
          <ol className="list-decimal pl-5 text-sm text-muted">
            <li>Open the OpenWA host, not this Vercel app.</li>
            <li>Scan from the dedicated business phone only.</li>
            <li>Wait until this card reads connected before sending campaigns.</li>
          </ol>
        </div>
      ) : null}
    </section>
  );
}
