import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const statusForEvent = (type: string) => {
  if (type === "email.delivered") return "delivered" as const;
  if (["email.failed", "email.bounced", "email.complained", "email.suppressed"].includes(type)) {
    return "failed" as const;
  }
  if (type === "email.sent") return "sent" as const;
  return null;
};

async function refreshCampaign(campaignId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("notifications").select("status").eq("campaign_id", campaignId);
  const statuses = ((data as { status: string }[] | null) ?? []).map((row) => row.status);
  if (!statuses.length) return;
  const sent = statuses.filter((status) => status === "sent" || status === "delivered").length;
  const delivered = statuses.filter((status) => status === "delivered").length;
  const failed = statuses.filter((status) => status === "failed").length;
  await admin.from("campaigns").update({
    sent_count: sent,
    delivered_count: delivered,
    failed_count: failed,
  }).eq("id", campaignId);
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || !process.env.RESEND_API_KEY || !hasServiceRole()) {
    return NextResponse.json({ error: "Webhook integration is not configured." }, { status: 503 });
  }

  const webhookId = request.headers.get("svix-id") ?? request.headers.get("webhook-id");
  const timestamp = request.headers.get("svix-timestamp") ?? request.headers.get("webhook-timestamp");
  const signature = request.headers.get("svix-signature") ?? request.headers.get("webhook-signature");
  if (!webhookId || !timestamp || !signature) {
    return NextResponse.json({ error: "Missing webhook signature headers." }, { status: 400 });
  }

  const payload = await request.text();
  let event: ReturnType<Resend["webhooks"]["verify"]>;
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: { id: webhookId, timestamp, signature },
      webhookSecret: secret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (!event.type.startsWith("email.")) return NextResponse.json({ received: true });
  const messageId = "email_id" in event.data ? event.data.email_id : null;
  const admin = createAdminClient();
  const { error: eventError } = await admin.from("provider_webhook_events").insert({
    provider: "resend",
    provider_event_id: webhookId,
    provider_message_id: messageId,
    event_type: event.type,
  });
  if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const nextStatus = statusForEvent(event.type);
  if (!messageId || !nextStatus) return NextResponse.json({ received: true });

  const update: Record<string, string | null> = {
    status: nextStatus,
    error_message: nextStatus === "failed" ? `Resend reported ${event.type}.` : null,
  };
  if (nextStatus === "sent" || nextStatus === "delivered") update.sent_at = event.created_at;
  const { data: notification, error } = await admin
    .from("notifications")
    .update(update)
    .eq("provider_message_id", messageId)
    .select("id, campaign_id, channel")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (notification) {
    await admin.from("notification_attempts").insert({
      notification_id: notification.id,
      channel: notification.channel,
      provider: "resend",
      provider_message_id: messageId,
      event_type: event.type,
      success: nextStatus !== "failed",
      response_preview: event.type,
    });
    if (notification.campaign_id) await refreshCampaign(String(notification.campaign_id));
  }

  return NextResponse.json({ received: true });
}

