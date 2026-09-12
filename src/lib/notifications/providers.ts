import type { NotificationStatus } from "@/types";
import { Resend } from "resend";

export type OutboundMessage = {
  id: string;
  channel: "email" | "whatsapp";
  to: string;
  subject?: string | null;
  body: string;
  html?: string | null;
  attachments?: {
    name: string;
    contentType: string;
    dataUrl?: string;
    url?: string;
  }[];
};

export type ProviderResult = {
  status: NotificationStatus;
  skipped?: boolean;
  reason?: string;
  preview?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textToHtml(value: string) {
  const escaped = escapeHtml(value);
  const withBasicMarkdown = escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">${withBasicMarkdown.replaceAll("\n", "<br />")}</div>`;
}

function resendAttachments(message: OutboundMessage) {
  const attachments: { filename: string; content?: string; path?: string }[] = [];
  for (const attachment of message.attachments ?? []) {
      if (attachment.dataUrl) {
        const match = attachment.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) continue;
        attachments.push({
          filename: attachment.name,
          content: match[2],
        });
        continue;
      }
      if (attachment.url) {
        attachments.push({
          filename: attachment.name,
          path: attachment.url,
        });
      }
  }
  return attachments;
}

export async function sendEmail(message: OutboundMessage): Promise<ProviderResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { status: "skipped", skipped: true, reason: "RESEND_API_KEY is not set." };
  }
  if (!message.to || !message.to.includes("@")) {
    return { status: "skipped", skipped: true, reason: "Email recipient is missing or invalid." };
  }

  try {
    const resend = new Resend(key);
    const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
    const subject = message.subject || "Wonders of Worship Experience";
    const attachments = resendAttachments(message);
    const { data, error } = await resend.emails.send({
      from,
      to: message.to,
      subject,
      text: message.body,
      html: message.html || textToHtml(message.body),
      ...(attachments.length ? { attachments } : {}),
    });

    if (error) {
      const reason = error.message;
      return { status: "failed", reason: reason.slice(0, 500), preview: JSON.stringify(error) };
    }

    const preview = data ? JSON.stringify(data) : "Email accepted by Resend.";
    return { status: "sent", preview: preview.slice(0, 500) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown Resend error.";
    return { status: "failed", reason: reason.slice(0, 500), preview: reason.slice(0, 500) };
  }
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
  if (!message.to) {
    return { status: "skipped", skipped: true, reason: "WhatsApp recipient is missing." };
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-Api-Key": apiKey, api_key: apiKey } : {}),
      },
      body: JSON.stringify({
        to: message.to.replace(/^\+/, ""),
        content: message.body,
        attachments: message.attachments ?? [],
      }),
    });
    const preview = await response.text();
    if (!response.ok) {
      return { status: "failed", reason: preview.slice(0, 500), preview };
    }
    return { status: "sent", preview: preview.slice(0, 500) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown OpenWA error.";
    return { status: "failed", reason: reason.slice(0, 500), preview: reason.slice(0, 500) };
  }
}
