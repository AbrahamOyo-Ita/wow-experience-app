import type { NotificationStatus } from "@/types";
import { Resend } from "resend";

export type OutboundMessage = {
  id: string;
  channel: "email" | "whatsapp";
  to: string;
  subject?: string | null;
  body: string;
};

export type ProviderResult = {
  status: NotificationStatus;
  skipped?: boolean;
  reason?: string;
  preview?: string;
};

export async function sendEmail(message: OutboundMessage): Promise<ProviderResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { status: "skipped", skipped: true, reason: "RESEND_API_KEY is not set." };
  }

  const resend = new Resend(key);
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const subject = message.subject || "Wonders of Worship Experience";
  const { data, error } = await resend.emails.send({
    from,
    to: message.to,
    subject,
    text: message.body,
    html: `<p>${message.body.replaceAll("\n", "<br />")}</p>`,
  });

  if (error) {
    const reason = error.message;
    return { status: "failed", reason: reason.slice(0, 500), preview: JSON.stringify(error) };
  }

  const preview = data ? JSON.stringify(data) : "Email accepted by Resend.";
  return { status: "sent", preview: preview.slice(0, 500) };
}

export async function sendWhatsApp(message: OutboundMessage): Promise<ProviderResult> {
  const base = process.env.OPENWA_BASE_URL;
  const apiKey = process.env.OPENWA_API_KEY;
  if (!base) {
    if (process.env.RESEND_API_KEY && message.to.includes("@")) {
      return sendEmail(message);
    }
    return { status: "skipped", skipped: true, reason: "OPENWA_BASE_URL is not set." };
  }

  const response = await fetch(`${base.replace(/\/$/, "")}/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Api-Key": apiKey } : {}),
    },
    body: JSON.stringify({
      to: message.to.replace(/^\+/, ""),
      content: message.body,
    }),
  });
  const preview = await response.text();
  if (!response.ok) {
    return { status: "failed", reason: preview.slice(0, 500), preview };
  }
  return { status: "sent", preview: preview.slice(0, 500) };
}
