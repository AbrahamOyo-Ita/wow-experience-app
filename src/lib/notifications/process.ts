import { hasServiceRole, createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendWhatsApp } from "@/lib/notifications/providers";
import type { CampaignChannelMode, MessageAttachment } from "@/types";

function render(template: string, payload: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(payload[key] ?? ""));
}

function channelsFor(mode: CampaignChannelMode) {
  if (mode === "email") return ["email"] as const;
  if (mode === "whatsapp") return ["whatsapp"] as const;
  return ["email", "whatsapp"] as const;
}

function payloadForContact(contact: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email_normalized,
    phone: contact.phone_normalized,
    ...extra,
  };
}

async function loadEligibleContacts(
  supabase: ReturnType<typeof createAdminClient>,
  campaign: Record<string, unknown>,
) {
  const targetIds = Array.isArray(campaign.target_contact_ids)
    ? (campaign.target_contact_ids as string[])
    : [];

  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, email_normalized, phone_normalized, preferred_channel, contact_consents(channel, purpose, status)");

  if (targetIds.length) {
    query = query.in("id", targetIds);
  } else if (String(campaign.audience_label ?? "").toLowerCase().includes("attendee")) {
    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("contact_id")
      .eq("edition_id", campaign.edition_id)
      .eq("response", "attending");
    const ids = [...new Set(((rsvps as { contact_id: string }[] | null) ?? []).map((row) => row.contact_id))];
    if (!ids.length) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[] | null) ?? [];
}

function hasConsent(contact: Record<string, unknown>, channel: "email" | "whatsapp") {
  const consents = (contact.contact_consents ?? []) as {
    channel?: string;
    purpose?: string;
    status?: string;
  }[];
  return consents.some(
    (row) =>
      row.channel === channel &&
      row.status === "granted" &&
      (row.purpose === "event_reminders" || row.purpose === "newsletter"),
  );
}

async function queueCampaignNotifications(
  supabase: ReturnType<typeof createAdminClient>,
  campaign: Record<string, unknown>,
) {
  const contacts = await loadEligibleContacts(supabase, campaign);
  const rows = [];
  let excluded = 0;

  for (const contact of contacts) {
    for (const channel of channelsFor(campaign.channel_mode as CampaignChannelMode)) {
      const to = channel === "email" ? contact.email_normalized : contact.phone_normalized;
      if (!to || !hasConsent(contact, channel)) {
        excluded += 1;
        continue;
      }
      rows.push({
        edition_id: campaign.edition_id,
        contact_id: contact.id,
        campaign_id: campaign.id,
        channel,
        template_key: "campaign_broadcast",
        to_address: to,
        payload: payloadForContact(contact, {
          subject: campaign.subject,
          body: channel === "email" ? campaign.email_body : campaign.whatsapp_body,
          attachments: campaign.attachments ?? [],
        }),
        scheduled_for: campaign.scheduled_at ?? new Date().toISOString(),
        status: "queued",
      });
    }
  }

  if (rows.length) {
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) throw new Error(error.message);
  }

  await supabase
    .from("campaigns")
    .update({
      status: rows.length ? "sending" : "completed",
      eligible_count: rows.length,
      excluded_count: excluded,
      started_at: new Date().toISOString(),
      completed_at: rows.length ? null : new Date().toISOString(),
    })
    .eq("id", campaign.id);

  return rows.length;
}

export async function processCampaignQueue(limit = 10) {
  if (!hasServiceRole()) {
    return {
      processed: 0,
      error: "SUPABASE_SERVICE_ROLE_KEY is required to process campaigns.",
    };
  }

  const supabase = createAdminClient();
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) return { processed: 0, error: error.message };

  let processed = 0;
  for (const campaign of (campaigns as Record<string, unknown>[] | null) ?? []) {
    try {
      await supabase.from("campaigns").update({ status: "queueing" }).eq("id", campaign.id);
      await queueCampaignNotifications(supabase, campaign);
      processed += 1;
    } catch (error) {
      await supabase
        .from("campaigns")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);
      await supabase.from("audit_logs").insert({
        actor_name: "System",
        action: "campaign.queue_failed",
        entity_type: "campaign",
        entity_id: String(campaign.id),
        metadata_preview: error instanceof Error ? error.message.slice(0, 500) : "Unknown campaign queue error.",
      });
    }
  }

  return { processed };
}

export async function processNewsletterBroadcast(newsletterId: string) {
  if (!hasServiceRole()) {
    return {
      queued: 0,
      error: "SUPABASE_SERVICE_ROLE_KEY is required to publish newsletter broadcasts.",
    };
  }

  const supabase = createAdminClient();
  const { data: newsletter, error: newsletterError } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", newsletterId)
    .maybeSingle();
  if (newsletterError || !newsletter) {
    return { queued: 0, error: newsletterError?.message ?? "Newsletter not found." };
  }

  const { data: subscribers, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .eq("status", "granted");
  if (error) return { queued: 0, error: error.message };

  const rows = ((subscribers as Record<string, unknown>[] | null) ?? []).map((subscriber) => ({
    channel: "email",
    template_key: "newsletter",
    to_address: subscriber.email_normalized,
    payload: {
      first_name: subscriber.name || "Friend",
      subject: newsletter.subject,
      body: newsletter.body,
      html: newsletter.body,
      newsletter_id: newsletter.id,
      newsletter_slug: newsletter.slug,
    },
    status: "queued",
    scheduled_for: new Date().toISOString(),
  }));

  if (rows.length) {
    const { error: insertError } = await supabase.from("notifications").insert(rows);
    if (insertError) return { queued: 0, error: insertError.message };
  }

  return { queued: rows.length };
}

export async function processNotificationQueue(limit = 25) {
  if (!hasServiceRole()) {
    return {
      processed: 0,
      error: "SUPABASE_SERVICE_ROLE_KEY is required to process notifications.",
    };
  }

  const campaignResult = await processCampaignQueue(Math.min(10, limit));
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_for", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return { processed: 0, error: error.message };
  }

  let processed = 0;
  for (const row of rows ?? []) {
    await supabase.from("notifications").update({ status: "processing" }).eq("id", row.id);
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const directBody = typeof payload.body === "string" ? payload.body : null;
    const directSubject = typeof payload.subject === "string" ? payload.subject : null;
    const attachments = Array.isArray(payload.attachments)
      ? (payload.attachments as MessageAttachment[])
      : [];
    const { data: template } = directBody
      ? { data: null }
      : await supabase
          .from("message_templates")
          .select("subject, body")
          .eq("category", row.template_key === "volunteer_receipt" ? "volunteer" : "rsvp")
          .eq("channel", row.channel)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

    const body = directBody ?? render(template?.body ?? "Thank you {{first_name}} for {{event_name}}.", payload);
    const subject = directSubject ?? (template?.subject ? render(template.subject, payload) : null);
    const to = String(row.to_address ?? "");
    const result =
      row.channel === "email"
        ? await sendEmail({
            id: row.id,
            channel: "email",
            to,
            subject,
            body,
            html: typeof payload.html === "string" ? payload.html : null,
            attachments,
          })
        : await sendWhatsApp({ id: row.id, channel: "whatsapp", to, subject, body, attachments });

    await supabase.from("notification_attempts").insert({
      notification_id: row.id,
      channel: row.channel,
      provider: row.channel === "email" ? "resend" : "openwa",
      success: result.status === "sent",
      response_preview: result.preview ?? result.reason ?? null,
    });

    await supabase
      .from("notifications")
      .update({
        status: result.status,
        skip_reason: result.reason ?? null,
        error_message: result.status === "failed" ? result.reason : null,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    processed += 1;
  }

  const { data: campaignIds } = await supabase
    .from("notifications")
    .select("campaign_id")
    .not("campaign_id", "is", null)
    .in("status", ["sent", "failed", "skipped"]);

  for (const campaignId of [
    ...new Set(((campaignIds as { campaign_id: string | null }[] | null) ?? []).map((row) => row.campaign_id).filter(Boolean)),
  ]) {
    const { data: totals } = await supabase
      .from("notifications")
      .select("status")
      .eq("campaign_id", campaignId);
    const statuses = ((totals as { status: string }[] | null) ?? []).map((row) => row.status);
    if (!statuses.length || statuses.some((status) => status === "queued" || status === "processing")) continue;
    const sentCount = statuses.filter((status) => status === "sent" || status === "delivered").length;
    const failedCount = statuses.filter((status) => status === "failed").length;
    await supabase
      .from("campaigns")
      .update({
        status: failedCount && !sentCount ? "failed" : "completed",
        sent_count: sentCount,
        delivered_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
  }

  return { processed, campaignsProcessed: campaignResult.processed };
}
