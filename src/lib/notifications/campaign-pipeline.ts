import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/providers";
import { renderRichEmailHtml } from "@/lib/notifications/email-template";
import { isValidEmail, renderCampaignTemplate } from "@/lib/notifications/campaign-pipeline-utils";

const LAGOS_TIME_ZONE = "Africa/Lagos";

export type CampaignRecipientStatus = "pending" | "processing" | "sent" | "failed" | "skipped";

export type RecipientPreview = {
  contactId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  valid: boolean;
  reason?: string;
};

export type RecipientSummary = {
  total: number;
  deduplicated: number;
  invalid: number;
  skipped: number;
  recipients: RecipientPreview[];
};

export { isValidEmail, parseLagosDateTime, renderCampaignTemplate } from "@/lib/notifications/campaign-pipeline-utils";

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export const campaignEmailConfig = {
  get batchSize() { return Math.max(1, numberEnv("EMAIL_BATCH_SIZE", 100)); },
  get batchDelayMs() { return numberEnv("EMAIL_BATCH_DELAY_MS", 1000); },
  get maxRetries() { return Math.max(1, numberEnv("EMAIL_MAX_RETRIES", 3)); },
};

function pause(ms: number) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function eventPayload(edition: Record<string, unknown> | null) {
  const startsAt = edition?.starts_at ? new Date(String(edition.starts_at)) : null;
  return {
    event_name: edition?.name ?? "Wonders of Worship",
    event_date: startsAt
      ? new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeZone: LAGOS_TIME_ZONE }).format(startsAt)
      : "",
    event_time: startsAt
      ? new Intl.DateTimeFormat("en-NG", { timeStyle: "short", timeZone: LAGOS_TIME_ZONE }).format(startsAt)
      : "",
    venue: edition?.venue_name ?? "",
    venue_address: edition?.venue_address ?? "",
    directions_url: edition?.directions_url ?? "",
  };
}

function audienceContactIds(campaign: Record<string, unknown>, rsvps: Record<string, unknown>[], volunteers: Record<string, unknown>[]) {
  const targetIds = Array.isArray(campaign.target_contact_ids) ? campaign.target_contact_ids as string[] : [];
  if (targetIds.length) return targetIds;
  const audience = String(campaign.audience_label ?? "").toLowerCase();
  if (audience.includes("attendee") || audience.includes("rsvp")) {
    return [...new Set(rsvps.map((row) => String(row.contact_id)).filter(Boolean))];
  }
  if (audience.includes("volunteer")) {
    const teamWords = ["choir", "worship", "media", "technical", "ushering", "protocol", "prayer", "intercession", "hospitality", "welfare"];
    const team = teamWords.find((word) => audience.includes(word));
    return [...new Set(volunteers
      .filter((row) => !team || `${(row.volunteer_teams as Record<string, unknown> | null)?.name ?? ""} ${(row.volunteer_teams as Record<string, unknown> | null)?.team_key ?? ""}`.toLowerCase().includes(team))
      .map((row) => String(row.contact_id)).filter(Boolean))];
  }
  return [];
}

async function resolveRecipients(supabase: ReturnType<typeof createAdminClient>, campaign: Record<string, unknown>): Promise<RecipientPreview[]> {
  const [{ data: rsvps }, { data: volunteers }] = await Promise.all([
    supabase.from("rsvps").select("contact_id").eq("edition_id", campaign.edition_id).eq("response", "attending"),
    supabase.from("volunteer_applications").select("contact_id, volunteer_teams(team_key, name)").eq("edition_id", campaign.edition_id).eq("status", "accepted"),
  ]);
  const ids = audienceContactIds(campaign, (rsvps as Record<string, unknown>[] | null) ?? [], (volunteers as Record<string, unknown>[] | null) ?? []);
  let query = supabase.from("contacts").select("id, first_name, last_name, email_normalized");
  if (ids.length) query = query.in("id", ids);
  else if (String(campaign.audience_label ?? "").toLowerCase().includes("specific")) return [];
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  const output: RecipientPreview[] = [];
  for (const contact of (data as Record<string, unknown>[] | null) ?? []) {
    const email = String(contact.email_normalized ?? "").trim().toLowerCase();
    const valid = isValidEmail(email);
    const key = email || `contact:${contact.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      contactId: String(contact.id),
      email,
      firstName: String(contact.first_name ?? "Friend"),
      lastName: String(contact.last_name ?? ""),
      valid,
      ...(valid ? {} : { reason: email ? "invalid email" : "missing email" }),
    });
  }
  return output;
}

export async function previewCampaignRecipients(campaignId: string): Promise<RecipientSummary> {
  if (!hasServiceRole()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for campaign previews.");
  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase.from("campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (error || !campaign) throw new Error(error?.message ?? "Campaign not found.");
  return summarize(await resolveRecipients(supabase, campaign as Record<string, unknown>));
}

export async function previewCampaignInput(campaign: Record<string, unknown>): Promise<RecipientSummary> {
  if (!hasServiceRole()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for campaign previews.");
  return summarize(await resolveRecipients(createAdminClient(), campaign));
}

function summarize(recipients: RecipientPreview[]): RecipientSummary {
  return {
    total: recipients.length,
    deduplicated: recipients.filter((recipient) => recipient.valid).length,
    invalid: recipients.filter((recipient) => !recipient.valid).length,
    skipped: recipients.filter((recipient) => !recipient.valid).length,
    recipients: recipients.slice(0, 200),
  };
}

export async function enqueueCampaignSend(campaignId: string, options: { dryRun?: boolean } = {}) {
  if (!hasServiceRole()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to send campaigns.");
  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase.from("campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (error || !campaign) throw new Error(error?.message ?? "Campaign not found.");
  const contacts = await resolveRecipients(supabase, campaign as Record<string, unknown>);
  const summary = summarize(contacts);
  if (options.dryRun) return summary;

  const { data: existing } = await supabase.from("campaign_recipients").select("contact_id, email").eq("campaign_id", campaignId);
  const existingKeys = new Set(((existing as Record<string, unknown>[] | null) ?? []).map((row) => `${row.contact_id ?? ""}:${String(row.email).toLowerCase()}`));
  const rows = contacts.map((recipient) => ({
    campaign_id: campaignId,
    contact_id: recipient.contactId,
    email: recipient.email || `missing-${recipient.contactId}@invalid.local`,
    status: recipient.valid ? "pending" : "skipped",
    last_error: recipient.reason ?? null,
  })).filter((row) => !existingKeys.has(`${row.contact_id ?? ""}:${String(row.email).toLowerCase()}`));
  if (rows.length) {
    const { error: insertError } = await supabase.from("campaign_recipients").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }
  await supabase.from("campaigns").update({
    status: summary.deduplicated ? "sending" : "completed",
    eligible_count: summary.deduplicated,
    excluded_count: summary.invalid,
    started_at: new Date().toISOString(),
    completed_at: summary.deduplicated ? null : new Date().toISOString(),
  }).eq("id", campaignId).in("status", ["queueing", "scheduled", "sending"]);
  return summary;
}

function isTransientFailure(reason: string) {
  return !/(invalid|unauthorized|forbidden|not found|unverified|missing|not set)/i.test(reason);
}

export async function processCampaign(campaignId: string, options: { failedOnly?: boolean } = {}) {
  if (!hasServiceRole()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to process campaigns.");
  const supabase = createAdminClient();
  const { data: campaign, error: campaignError } = await supabase.from("campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (campaignError || !campaign) throw new Error(campaignError?.message ?? "Campaign not found.");
  const { data: edition } = await supabase.from("event_editions").select("name, starts_at, venue_name, venue_address, directions_url").eq("id", campaign.edition_id).maybeSingle();
  const payloadBase = eventPayload(edition as Record<string, unknown> | null);
  await supabase.from("campaign_recipients").update({ status: "pending", last_error: "Recovered after an interrupted send." }).eq("campaign_id", campaignId).eq("status", "processing").lt("last_attempt_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());
  const filter = options.failedOnly ? ["failed"] : ["pending"];
  let processed = 0;
  for (;;) {
    const { data: rows, error } = await supabase.from("campaign_recipients").select("*").eq("campaign_id", campaignId).in("status", filter).order("id").limit(campaignEmailConfig.batchSize);
    if (error) throw new Error(error.message);
    if (!rows?.length) break;
    for (const row of rows as Record<string, unknown>[]) {
      const attempt = Number(row.attempt_count ?? 0) + 1;
      const { data: claimed } = await supabase.from("campaign_recipients").update({ status: "processing", attempt_count: attempt, last_attempt_at: new Date().toISOString() }).eq("id", row.id).eq("status", row.status).select("id").maybeSingle();
      if (!claimed) continue;
      const { data: contact } = row.contact_id ? await supabase.from("contacts").select("first_name, last_name").eq("id", row.contact_id).maybeSingle() : { data: null };
      const payload = { ...payloadBase, first_name: contact?.first_name ?? "Friend", last_name: contact?.last_name ?? "", email: row.email };
      const body = renderCampaignTemplate(String(campaign.email_body ?? ""), payload);
      const subject = renderCampaignTemplate(String(campaign.subject ?? `Notification: ${payload.event_name}`), payload);
      const result = await sendEmail({
        to: String(row.email), subject, body,
        html: renderRichEmailHtml({ headline: subject, bodyMarkdown: body, recipientEmail: String(row.email), venueCard: true, scriptureQuote: true }),
      });
      const reason = result.reason ?? (result.status === "sent" ? null : "Email provider did not send the message.");
      const sent = result.status === "sent";
      const retry = !sent && isTransientFailure(String(reason)) && attempt < campaignEmailConfig.maxRetries;
      await supabase.from("campaign_recipients").update({
        status: sent ? "sent" : retry ? "pending" : "failed",
        last_error: sent ? null : reason,
        sent_at: sent ? new Date().toISOString() : null,
      }).eq("id", row.id);
      await supabase.from("audit_logs").insert({
        actor_name: "System",
        action: sent ? "campaign_recipient.sent" : "campaign_recipient.failed",
        entity_type: "campaign",
        entity_id: campaignId,
        metadata_preview: `${row.email}: ${result.preview ?? reason ?? "sent"}`.slice(0, 500),
      });
      if (!sent && retry) await pause(250 * 2 ** Math.max(0, attempt - 1));
      processed += 1;
    }
    await pause(campaignEmailConfig.batchDelayMs);
  }
  const { data: totals } = await supabase.from("campaign_recipients").select("status").eq("campaign_id", campaignId);
  const statuses = (totals as { status: string }[] | null) ?? [];
  const sent = statuses.filter((row) => row.status === "sent").length;
  const failed = statuses.filter((row) => row.status === "failed").length;
  const pending = statuses.filter((row) => row.status === "pending" || row.status === "processing").length;
  await supabase.from("campaigns").update({ sent_count: sent, failed_count: failed, eligible_count: statuses.length, status: pending ? "sending" : failed && !sent ? "failed" : "completed", completed_at: pending ? null : new Date().toISOString() }).eq("id", campaignId);
  return { processed, sent, failed, pending, skipped: statuses.filter((row) => row.status === "skipped").length };
}

export async function forceRetryFailed(campaignId: string) {
  if (!hasServiceRole()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to retry campaigns.");
  const supabase = createAdminClient();
  await supabase.from("campaign_recipients").update({ status: "pending", last_error: null }).eq("campaign_id", campaignId).eq("status", "failed").lt("attempt_count", campaignEmailConfig.maxRetries);
  return processCampaign(campaignId);
}
