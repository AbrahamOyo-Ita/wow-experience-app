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

function localEventDayAtSeven(dateValue: string) {
  const date = new Date(dateValue);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${values.year}-${values.month}-${values.day}T07:00:00+01:00`);
}

async function processAutomationQueue(supabase: ReturnType<typeof createAdminClient>, limit = 20) {
  const now = new Date();
  const { data: rules, error } = await supabase
    .from("automation_rules")
    .select("*, event_editions(id, name, starts_at, ends_at, venue_name, venue_city, venue_address, directions_url)")
    .eq("enabled", true)
    .in("trigger_type", ["two_day_reminder", "event_day_reminder", "post_event_thank_you"])
    .limit(limit);
  if (error) return { processed: 0, error: error.message };

  let processed = 0;
  for (const rule of (rules as Record<string, unknown>[] | null) ?? []) {
    const edition = rule.event_editions as Record<string, unknown> | null;
    if (!edition?.starts_at || !edition.ends_at) continue;
    const startsAt = new Date(String(edition.starts_at));
    const endsAt = new Date(String(edition.ends_at));
    const trigger = String(rule.trigger_type);
    const dueAt = trigger === "two_day_reminder"
      ? new Date(startsAt.getTime() - 48 * 60 * 60 * 1000)
      : trigger === "event_day_reminder"
        ? localEventDayAtSeven(String(edition.starts_at))
        : new Date(endsAt.getTime() + Number(rule.offset_minutes ?? 1440) * 60 * 1000);
    if (rule.last_run_at || now < dueAt) {
      if (!rule.last_run_at) {
        await supabase.from("automation_rules").update({ next_run_at: dueAt.toISOString() }).eq("id", rule.id);
      }
      continue;
    }

    const { data: rsvps, error: rsvpError } = await supabase
      .from("rsvps")
      .select("contact_id")
      .eq("edition_id", edition.id)
      .eq("response", "attending");
    if (rsvpError) {
      await supabase.from("automation_rules").update({ last_run_at: now.toISOString(), last_run_status: "failed" }).eq("id", rule.id);
      continue;
    }
    const contactIds = [...new Set(((rsvps as { contact_id: string }[] | null) ?? []).map((item) => item.contact_id))];
    const { data: contacts } = contactIds.length
      ? await supabase.from("contacts").select("id, first_name, email_normalized, phone_normalized, contact_consents(channel, purpose, status)").in("id", contactIds)
      : { data: [] };
    const body = trigger === "two_day_reminder"
      ? "{{first_name}}, {{event_name}} is in two days. {{event_date}} at {{event_time}}. Venue: {{venue}}."
      : trigger === "event_day_reminder"
        ? "{{first_name}}, today is {{event_name}}. We look forward to seeing you at {{venue}}."
        : "Thank you for joining {{event_name}}. We are grateful you gathered with us."
    const rows: Record<string, unknown>[] = [];
    for (const contact of (contacts as Record<string, unknown>[] | null) ?? []) {
      const consents = (contact.contact_consents ?? []) as { channel?: string; purpose?: string; status?: string }[];
      for (const channel of channelsFor(rule.channel_mode as CampaignChannelMode)) {
        const address = channel === "email" ? contact.email_normalized : contact.phone_normalized;
        const allowed = consents.some((consent) => consent.channel === channel && consent.status === "granted" && ["event_reminders", "newsletter"].includes(consent.purpose ?? ""));
        if (!address || !allowed) continue;
        rows.push({
          edition_id: edition.id,
          contact_id: contact.id,
          automation_rule_id: rule.id,
          channel,
          template_key: trigger,
          to_address: address,
          payload: {
            first_name: contact.first_name,
            event_name: edition.name,
            event_date: new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeZone: "Africa/Lagos" }).format(startsAt),
            event_time: new Intl.DateTimeFormat("en-NG", { timeStyle: "short", timeZone: "Africa/Lagos" }).format(startsAt),
            venue: edition.venue_name,
            body,
            subject: trigger === "post_event_thank_you" ? `Thank you for joining ${edition.name}` : `Reminder: ${edition.name}`,
          },
          scheduled_for: now.toISOString(),
          status: "queued",
        });
      }
    }
    if (rows.length) await supabase.from("notifications").upsert(rows, { onConflict: "automation_rule_id,contact_id,channel", ignoreDuplicates: true });
    await supabase.from("automation_rules").update({ last_run_at: now.toISOString(), last_run_status: "success", next_run_at: null }).eq("id", rule.id);
    processed += 1;
  }
  return { processed };
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
  } else {
    const audience = String(campaign.audience_label ?? "").toLowerCase();
    if (audience.includes("attendee") || audience.includes("rsvp")) {
      const { data: rsvps } = await supabase
        .from("rsvps")
        .select("contact_id")
        .eq("edition_id", campaign.edition_id)
        .eq("response", "attending");
      const ids = [...new Set(((rsvps as { contact_id: string }[] | null) ?? []).map((row) => row.contact_id))];
      if (!ids.length) return [];
      query = query.in("id", ids);
    } else if (audience.includes("volunteer")) {
      const { data: volApps } = await supabase
        .from("volunteer_applications")
        .select("contact_id, team_id, volunteer_teams(team_key, name)")
        .eq("edition_id", campaign.edition_id)
        .eq("status", "accepted");

      let matchedApps = (volApps as { contact_id: string; team_id?: string; volunteer_teams?: { team_key?: string; name?: string } }[] | null) ?? [];
      const teams = ["choir", "worship", "media", "technical", "ushering", "protocol", "prayer", "intercession", "hospitality", "welfare"];
      const matchedTeam = teams.find((t) => audience.includes(t));
      if (matchedTeam) {
        matchedApps = matchedApps.filter((item) => {
          const teamName = `${item.volunteer_teams?.name ?? ""} ${item.volunteer_teams?.team_key ?? ""}`.toLowerCase();
          return teamName.includes(matchedTeam);
        });
      }

      const ids = [...new Set(matchedApps.map((row) => row.contact_id))];
      if (!ids.length) return [];
      query = query.in("id", ids);
    }
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
  if (!consents.length) return true;
  return consents.some(
    (row) =>
      row.channel === channel &&
      row.status === "granted" &&
      [
        "event_reminders",
        "newsletter",
        "volunteer_updates",
        "attendance",
        "enquiry",
      ].includes(row.purpose ?? ""),
  );
}

async function queueCampaignNotifications(
  supabase: ReturnType<typeof createAdminClient>,
  campaign: Record<string, unknown>,
) {
  const contacts = await loadEligibleContacts(supabase, campaign);
  const rows = [];
  let excluded = 0;

  const { data: edition } = await supabase
    .from("event_editions")
    .select("name, starts_at, venue_name, venue_address, directions_url")
    .eq("id", campaign.edition_id)
    .maybeSingle();

  const startsAt = edition?.starts_at ? new Date(String(edition.starts_at)) : null;
  const eventDate = startsAt
    ? new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeZone: "Africa/Lagos" }).format(startsAt)
    : "";
  const eventTime = startsAt
    ? new Intl.DateTimeFormat("en-NG", { timeStyle: "short", timeZone: "Africa/Lagos" }).format(startsAt)
    : "";

  const eventPayload = {
    event_name: edition?.name ?? "Wonders of Worship",
    event_date: eventDate,
    event_time: eventTime,
    venue: edition?.venue_name ?? "",
    venue_address: edition?.venue_address ?? "",
    directions_url: edition?.directions_url ?? "",
  };

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
          ...eventPayload,
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
  const automationResult = await processAutomationQueue(supabase, Math.min(20, limit));
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await supabase
    .from("notifications")
    .update({ status: "queued", processing_started_at: null, error_message: "Recovered after an interrupted worker run." })
    .eq("status", "processing")
    .lt("processing_started_at", staleBefore);

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
    const { data: claimed } = await supabase
      .from("notifications")
      .update({ status: "processing", processing_started_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;
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

    const body = directBody
      ? render(directBody, payload)
      : render(template?.body ?? "Thank you {{first_name}} for {{event_name}}.", payload);
    const subject = directSubject
      ? render(directSubject, payload)
      : (template?.subject ? render(template.subject, payload) : null);
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
      provider_message_id: result.providerMessageId ?? null,
      event_type: result.status,
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
        provider_message_id: result.providerMessageId ?? null,
        processing_started_at: null,
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
    const deliveredCount = statuses.filter((status) => status === "delivered").length;
    const failedCount = statuses.filter((status) => status === "failed").length;
    await supabase
      .from("campaigns")
      .update({
        status: failedCount && !sentCount ? "failed" : "completed",
        sent_count: sentCount,
        delivered_count: deliveredCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
  }

  return {
    processed,
    campaignsProcessed: campaignResult.processed,
    automationsProcessed: automationResult.processed,
    automationError: automationResult.error,
  };
}
