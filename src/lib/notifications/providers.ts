import type { NotificationStatus } from "@/types";
import { Resend } from "resend";

export type OutboundMessage = {
  id?: string;
  channel?: "email" | "whatsapp";
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
  providerMessageId?: string;
  skipped?: boolean;
  reason?: string;
  preview?: string;
};

import { renderRichEmailHtml } from "./email-template";

function textToHtml(value: string, subject?: string | null, to?: string) {
  return renderRichEmailHtml({
    headline: subject || "Wonders of Worship Experience",
    bodyMarkdown: value,
    recipientEmail: to,
    scriptureQuote: true,
    venueCard: true,
  });
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
  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    return { status: "skipped", skipped: true, reason: "RESEND_FROM is not set." };
  }
  if (!message.to || !message.to.includes("@")) {
    return { status: "skipped", skipped: true, reason: "Email recipient is missing or invalid." };
  }

  try {
    const resend = new Resend(key);
    const subject = message.subject || "Wonders of Worship Experience";
    const attachments = resendAttachments(message);
    const html =
      message.html && message.html.includes("<html")
        ? message.html
        : message.html
        ? renderRichEmailHtml({
            headline: subject,
            bodyHtml: message.html,
            recipientEmail: message.to,
            scriptureQuote: true,
            venueCard: true,
          })
        : textToHtml(message.body, subject, message.to);

    const { data, error } = await resend.emails.send({
      from,
      to: message.to,
      subject,
      text: message.body,
      html,
      ...(attachments.length ? { attachments } : {}),
    });

    if (error) {
      const reason = `${error.message} (sender: ${from})`;
      return { status: "failed", reason: reason.slice(0, 500), preview: JSON.stringify(error) };
    }

    const preview = data ? JSON.stringify(data) : "Email accepted by Resend.";
    return {
      status: "sent",
      providerMessageId: data?.id,
      preview: preview.slice(0, 500),
    };
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
  if (!apiKey) {
    return { status: "skipped", skipped: true, reason: "OPENWA_API_KEY is not set." };
  }
  if (!message.to) {
    return { status: "skipped", skipped: true, reason: "WhatsApp recipient is missing." };
  }

  try {
    const sessionId = process.env.OPENWA_SESSION_ID?.trim() || "wow-primary";
    const chatId = message.to.replace(/^\+/, "").replace(/@c\.us$/i, "") + "@c.us";
    const response = await fetch(`${base.replace(/\/$/, "")}/api/sessions/${encodeURIComponent(sessionId)}/messages/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-Api-Key": apiKey, api_key: apiKey } : {}),
      },
      body: JSON.stringify({
        chatId,
        text: message.body,
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
