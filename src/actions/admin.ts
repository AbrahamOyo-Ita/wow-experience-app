"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkInAttendance } from "@/actions/public";
import {
  processCampaignQueue,
  processNewsletterBroadcast,
  processNotificationQueue,
} from "@/lib/notifications/process";
import { campaignScheduleSchema, newsletterPublishSchema } from "@/lib/validation";
import type { AttendanceInput, MockSubmitResult } from "@/services/contracts";
import type {
  AdminUser,
  AttendanceRecord,
  AuditLog,
  AutomationRule,
  Campaign,
  Contact,
  ContactConsent,
  EventEdition,
  MessageTemplate,
  Newsletter,
  NewsletterSubscriber,
  Rsvp,
  VolunteerApplication,
  VolunteerStatus,
  WhatsAppSession,
} from "@/types";

export type AdminBundle = {
  profile: AdminUser | null;
  contacts: Contact[];
  consents: ContactConsent[];
  rsvps: Rsvp[];
  attendance: AttendanceRecord[];
  volunteers: VolunteerApplication[];
  campaigns: Campaign[];
  newsletters: Newsletter[];
  newsletterSubscribers: NewsletterSubscriber[];
  templates: MessageTemplate[];
  automations: AutomationRule[];
  auditLogs: AuditLog[];
  editions: EventEdition[];
  whatsappSession: WhatsAppSession | null;
  adminUsers: AdminUser[];
  error?: string;
};

function mapEdition(row: Record<string, unknown>): EventEdition {
  return {
    id: String(row.legacy_key ?? row.id),
    year: Number(row.year),
    name: String(row.name),
    shortName: String(row.short_name),
    slug: String(row.slug),
    theme: String(row.theme ?? ""),
    statement: String(row.statement ?? ""),
    description: String(row.description ?? ""),
    timezone: String(row.timezone ?? "Africa/Lagos"),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    doorsAt: String(row.doors_at),
    venue: {
      name: String(row.venue_name),
      address: String(row.venue_address),
      city: String(row.venue_city),
      country: String(row.venue_country),
      directionsUrl: String(row.directions_url ?? ""),
      notes: String(row.venue_notes ?? ""),
    },
    status: row.status as EventEdition["status"],
    publishedAt: row.published_at ? String(row.published_at) : null,
    galleryDriveUrl: String(row.gallery_drive_url ?? ""),
    attendanceUrl: String(row.attendance_url),
    attendanceWindowStartsAt: String(row.attendance_window_starts_at),
    attendanceWindowEndsAt: String(row.attendance_window_ends_at),
    reminderTwoDayEnabled: Boolean(row.reminder_two_day_enabled),
    reminderEventDayEnabled: Boolean(row.reminder_event_day_enabled),
    reminderEventDayTime: String(row.reminder_event_day_time ?? "07:00"),
    qrTargetUrl: String(row.qr_target_url),
    isDatePlaceholder: Boolean(row.is_date_placeholder),
    isVenuePlaceholder: Boolean(row.is_venue_placeholder),
  };
}

function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name ?? ""),
    email: row.email ? String(row.email) : null,
    emailNormalized: row.email_normalized ? String(row.email_normalized) : null,
    phone: String(row.phone),
    phoneNormalized: String(row.phone_normalized ?? row.phone),
    occupation: row.occupation ? String(row.occupation) : null,
    location: row.location ? String(row.location) : null,
    preferredChannel: row.preferred_channel as Contact["preferredChannel"],
    createdAt: String(row.created_at),
  };
}

function emptyBundle(error?: string): AdminBundle {
  return {
    profile: null,
    contacts: [],
    consents: [],
    rsvps: [],
    attendance: [],
    volunteers: [],
    campaigns: [],
    newsletters: [],
    newsletterSubscribers: [],
    templates: [],
    automations: [],
    auditLogs: [],
    editions: [],
    whatsappSession: null,
    adminUsers: [],
    error,
  };
}

export async function loadAdminBundle(): Promise<AdminBundle> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return emptyBundle("Sign in required.");

  const [
    profileRes,
    rolesRes,
    contactsRes,
    consentsRes,
    rsvpsRes,
    attendanceRes,
    volunteersRes,
    campaignsRes,
    newslettersRes,
    newsletterSubscribersRes,
    templatesRes,
    automationsRes,
    auditRes,
    editionsRes,
    sessionRes,
    profilesRes,
    allRolesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("profile_roles").select("role").eq("profile_id", userId),
    supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    supabase.from("contact_consents").select("*"),
    supabase.from("rsvps").select("*").order("created_at", { ascending: false }),
    supabase.from("attendance_records").select("*").order("checked_in_at", { ascending: false }),
    supabase.from("volunteer_applications").select("*, volunteer_teams(team_key)").order("created_at", { ascending: false }),
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("newsletters").select("*").order("created_at", { ascending: false }),
    supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }),
    supabase.from("message_templates").select("*").order("name"),
    supabase.from("automation_rules").select("*"),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("event_editions").select("*").order("year", { ascending: false }),
    supabase.from("whatsapp_sessions").select("*").limit(1).maybeSingle(),
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("profile_roles").select("profile_id, role"),
  ]);

  const firstError =
    profileRes.error ||
    rolesRes.error ||
    contactsRes.error ||
    rsvpsRes.error;

  const role = (rolesRes.data?.[0]?.role as AdminUser["role"] | undefined) ?? "content_editor";
  const profileRow = profileRes.data as Record<string, unknown> | null;
  const editionKey = new Map(
    ((editionsRes.data as Record<string, unknown>[] | null) ?? []).map((row) => [
      String(row.id),
      String(row.legacy_key),
    ]),
  );
  const teamKey = (row: Record<string, unknown>) => {
    const nested = row.volunteer_teams as { team_key?: string } | null;
    return nested?.team_key ?? String(row.team_id);
  };

  const roleByProfile = new Map<string, AdminUser["role"]>();
  for (const row of (allRolesRes.data as { profile_id: string; role: AdminUser["role"] }[] | null) ?? []) {
    if (!roleByProfile.has(row.profile_id)) roleByProfile.set(row.profile_id, row.role);
  }

  return {
    profile: profileRow
      ? {
          id: String(profileRow.id),
          name: String(profileRow.full_name || profileRow.email || "Admin"),
          email: String(profileRow.email ?? ""),
          role,
          status: "active",
        }
      : null,
    contacts: ((contactsRes.data as Record<string, unknown>[] | null) ?? []).map(mapContact),
    consents: ((consentsRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      contactId: String(row.contact_id),
      purpose: row.purpose as ContactConsent["purpose"],
      channel: row.channel as ContactConsent["channel"],
      status: row.status as ContactConsent["status"],
      source: String(row.source),
      policyVersion: String(row.policy_version),
      capturedAt: String(row.captured_at),
      revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    })),
    rsvps: ((rsvpsRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      eventId: editionKey.get(String(row.edition_id)) ?? String(row.edition_id),
      contactId: String(row.contact_id),
      response: row.response as Rsvp["response"],
      source: String(row.source),
      preferredChannel: row.preferred_channel as Rsvp["preferredChannel"],
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
    attendance: ((attendanceRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      eventId: editionKey.get(String(row.edition_id)) ?? String(row.edition_id),
      contactId: String(row.contact_id),
      checkedInAt: String(row.checked_in_at),
      source: row.source as AttendanceRecord["source"],
      occupationSnapshot: String(row.occupation_snapshot ?? ""),
      deviceCategory: row.device_category as AttendanceRecord["deviceCategory"],
      duplicateOfId: row.duplicate_of_id ? String(row.duplicate_of_id) : null,
      createdBy: row.created_by ? String(row.created_by) : null,
    })),
    volunteers: ((volunteersRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      eventId: editionKey.get(String(row.edition_id)) ?? String(row.edition_id),
      contactId: String(row.contact_id),
      teamId: teamKey(row),
      experience: String(row.experience),
      availability: String(row.availability),
      motivation: String(row.motivation),
      occupation: row.occupation ? String(row.occupation) : undefined,
      location: row.location ? String(row.location) : undefined,
      status: row.status as VolunteerApplication["status"],
      reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
      reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
    campaigns: ((campaignsRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      eventId: editionKey.get(String(row.edition_id)) ?? String(row.edition_id),
      name: String(row.name),
      type: row.type as Campaign["type"],
      status: row.status as Campaign["status"],
      channelMode: row.channel_mode as Campaign["channelMode"],
      audienceLabel: String(row.audience_label ?? ""),
      subject: row.subject ? String(row.subject) : null,
      whatsappBody: row.whatsapp_body ? String(row.whatsapp_body) : null,
      emailBody: row.email_body ? String(row.email_body) : null,
      scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
      eligibleCount: Number(row.eligible_count ?? 0),
      excludedCount: Number(row.excluded_count ?? 0),
      sentCount: Number(row.sent_count ?? 0),
      deliveredCount: Number(row.delivered_count ?? 0),
      failedCount: Number(row.failed_count ?? 0),
      startedAt: row.started_at ? String(row.started_at) : null,
      completedAt: row.completed_at ? String(row.completed_at) : null,
      createdBy: row.created_by ? String(row.created_by) : undefined,
      createdAt: String(row.created_at),
      targetContactIds: Array.isArray(row.target_contact_ids) ? (row.target_contact_ids as string[]) : [],
      attachments: Array.isArray(row.attachments) ? (row.attachments as Campaign["attachments"]) : [],
    })),
    newsletters: ((newslettersRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      subject: String(row.subject),
      excerpt: String(row.excerpt ?? ""),
      body: String(row.body),
      status: row.status as Newsletter["status"],
      publishedAt: row.published_at ? String(row.published_at) : null,
      createdBy: row.created_by ? String(row.created_by) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
    newsletterSubscribers: ((newsletterSubscribersRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      email: String(row.email),
      emailNormalized: String(row.email_normalized),
      name: row.name ? String(row.name) : null,
      status: row.status as NewsletterSubscriber["status"],
      source: String(row.source ?? "footer"),
      subscribedAt: String(row.subscribed_at),
      unsubscribedAt: row.unsubscribed_at ? String(row.unsubscribed_at) : null,
    })),
    templates: ((templatesRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      eventId: row.edition_id ? (editionKey.get(String(row.edition_id)) ?? String(row.edition_id)) : null,
      name: String(row.name),
      category: row.category as MessageTemplate["category"],
      channel: row.channel as MessageTemplate["channel"],
      subject: row.subject ? String(row.subject) : null,
      previewText: row.preview_text ? String(row.preview_text) : null,
      body: String(row.body),
      variables: (row.variables as string[]) ?? [],
      version: Number(row.version ?? 1),
      status: row.status as MessageTemplate["status"],
    })),
    automations: ((automationsRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      eventId: editionKey.get(String(row.edition_id)) ?? String(row.edition_id),
      name: String(row.name),
      triggerType: row.trigger_type as AutomationRule["triggerType"],
      offsetMinutes: row.offset_minutes === null ? null : Number(row.offset_minutes),
      runTime: row.run_time ? String(row.run_time) : null,
      channelMode: row.channel_mode as AutomationRule["channelMode"],
      enabled: Boolean(row.enabled),
      nextRunAt: row.next_run_at ? String(row.next_run_at) : null,
      lastRunAt: row.last_run_at ? String(row.last_run_at) : null,
      lastRunStatus: (row.last_run_status as AutomationRule["lastRunStatus"]) ?? "never",
    })),
    auditLogs: ((auditRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      actorId: String(row.actor_id ?? "system"),
      actorName: String(row.actor_name ?? "System"),
      action: String(row.action),
      entityType: String(row.entity_type),
      entityId: String(row.entity_id ?? ""),
      metadataPreview: String(row.metadata_preview ?? ""),
      createdAt: String(row.created_at),
    })),
    editions: ((editionsRes.data as Record<string, unknown>[] | null) ?? []).map(mapEdition),
    whatsappSession: sessionRes.data
      ? {
          id: String((sessionRes.data as Record<string, unknown>).id),
          sessionKey: String((sessionRes.data as Record<string, unknown>).session_key),
          displayName: String((sessionRes.data as Record<string, unknown>).display_name),
          maskedPhone: String((sessionRes.data as Record<string, unknown>).masked_phone ?? ""),
          provider: "openwa",
          status: (sessionRes.data as Record<string, unknown>).status as WhatsAppSession["status"],
          lastSeenAt: (sessionRes.data as Record<string, unknown>).last_seen_at
            ? String((sessionRes.data as Record<string, unknown>).last_seen_at)
            : null,
          lastActivity: String((sessionRes.data as Record<string, unknown>).last_activity ?? ""),
          healthNote: String((sessionRes.data as Record<string, unknown>).health_note ?? ""),
          lastErrorCode: (sessionRes.data as Record<string, unknown>).last_error_code
            ? String((sessionRes.data as Record<string, unknown>).last_error_code)
            : null,
        }
      : null,
    adminUsers: ((profilesRes.data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.full_name || row.email || "Admin"),
      email: String(row.email ?? ""),
      role: roleByProfile.get(String(row.id)) ?? "content_editor",
      status: "active" as const,
    })),
    error: firstError?.message,
  };
}

export async function updateVolunteerStatusAction(id: string, status: VolunteerStatus) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  const { data, error } = await supabase
    .from("volunteer_applications")
    .update({
      status,
      reviewed_by: userId ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, volunteer_teams(team_key)")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Application not found." } as MockSubmitResult<VolunteerApplication>;
  }

  const row = data as Record<string, unknown>;
  const nested = row.volunteer_teams as { team_key?: string } | null;
  return {
    status: "success",
    data: {
      id: String(row.id),
      eventId: String(row.edition_id),
      contactId: String(row.contact_id),
      teamId: nested?.team_key ?? String(row.team_id),
      experience: String(row.experience),
      availability: String(row.availability),
      motivation: String(row.motivation),
      occupation: row.occupation ? String(row.occupation) : undefined,
      location: row.location ? String(row.location) : undefined,
      status: row.status as VolunteerStatus,
      reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
      reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    },
  } satisfies MockSubmitResult<VolunteerApplication>;
}

export async function toggleAutomationAction(id: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_rules").update({ enabled }).eq("id", id);
  if (error) return { status: "error" as const, message: error.message };
  return { status: "success" as const };
}

export async function saveEditionAction(edition: EventEdition) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_editions")
    .update({
      name: edition.name,
      short_name: edition.shortName,
      theme: edition.theme,
      statement: edition.statement,
      description: edition.description,
      starts_at: edition.startsAt,
      ends_at: edition.endsAt,
      doors_at: edition.doorsAt,
      venue_name: edition.venue.name,
      venue_address: edition.venue.address,
      venue_city: edition.venue.city,
      venue_country: edition.venue.country,
      directions_url: edition.venue.directionsUrl,
      venue_notes: edition.venue.notes,
      status: edition.status,
      is_venue_placeholder: edition.isVenuePlaceholder ?? false,
      is_date_placeholder: edition.isDatePlaceholder ?? false,
      reminder_two_day_enabled: edition.reminderTwoDayEnabled,
      reminder_event_day_enabled: edition.reminderEventDayEnabled,
      reminder_event_day_time: edition.reminderEventDayTime,
    })
    .or(`legacy_key.eq.${edition.id},slug.eq.${edition.slug},year.eq.${edition.year}`);

  if (error) return { status: "error" as const, message: error.message };
  return { status: "success" as const, data: edition };
}

export async function scheduleCampaignAction(campaign: Partial<Campaign>) {
  const parsed = campaignScheduleSchema.safeParse({
    ...campaign,
    targetContactIds: campaign.targetContactIds ?? [],
    sendNow: !campaign.scheduledAt,
  });
  if (!parsed.success) {
    return {
      status: "validation" as const,
      errors: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "form"),
        message: issue.message,
      })),
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return { status: "error" as const, message: "Sign in required." };

  const input = parsed.data;
  const { data: edition } = await supabase
    .from("event_editions")
    .select("id, legacy_key")
    .or(
      `legacy_key.eq.${input.eventId},slug.eq.${input.eventId},year.eq.${input.eventId}`,
    )
    .maybeSingle();

  if (!edition) {
    return { status: "error" as const, message: "Edition not found." };
  }

  const insert = {
    edition_id: edition.id,
    name: input.name,
    type: "broadcast",
    status: "scheduled" as const,
    channel_mode: input.channelMode,
    audience_label: input.audienceLabel,
    subject: input.subject ?? null,
    whatsapp_body: input.whatsappBody ?? "",
    email_body: input.emailBody ?? "",
    scheduled_at: input.sendNow ? new Date().toISOString() : input.scheduledAt,
    target_contact_ids: input.targetContactIds ?? [],
    attachments: campaign.attachments ?? [],
    eligible_count: 0,
    excluded_count: 0,
    created_by: userId,
  };

  const { data, error } = await supabase.from("campaigns").insert(insert).select("*").maybeSingle();
  if (error || !data) {
    return { status: "error" as const, message: error?.message ?? "Could not schedule campaign." };
  }

  if (input.sendNow) {
    await processCampaignQueue(10);
    await processNotificationQueue(50);
  }

  revalidatePath("/admin/campaigns");

  return {
    status: "success" as const,
    data: {
      id: data.id,
      eventId: edition.legacy_key,
      name: data.name,
      type: data.type,
      status: data.status,
      channelMode: data.channel_mode,
      audienceLabel: data.audience_label,
      subject: data.subject,
      whatsappBody: data.whatsapp_body,
      emailBody: data.email_body,
      scheduledAt: data.scheduled_at,
      eligibleCount: data.eligible_count,
      excludedCount: data.excluded_count,
      sentCount: data.sent_count,
      deliveredCount: data.delivered_count,
      failedCount: data.failed_count,
      createdAt: data.created_at,
      targetContactIds: data.target_contact_ids ?? [],
      attachments: data.attachments ?? [],
    } as Campaign,
  };
}

export async function saveNewsletterAction(input: Partial<Newsletter> & { publish?: boolean }) {
  const parsed = newsletterPublishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "validation" as const,
      errors: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "form"),
        message: issue.message,
      })),
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return { status: "error" as const, message: "Sign in required." };

  const payload = parsed.data;
  const slugBase = payload.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "newsletter";

  const row = {
    title: payload.title,
    slug: slugBase,
    subject: payload.subject,
    excerpt: payload.excerpt ?? "",
    body: payload.body,
    status: payload.publish ? "published" : "draft",
    published_at: payload.publish ? new Date().toISOString() : null,
    created_by: userId,
  };

  const request = payload.id
    ? supabase.from("newsletters").update(row).eq("id", payload.id).select("*").maybeSingle()
    : supabase.from("newsletters").insert(row).select("*").maybeSingle();

  const { data, error } = await request;
  if (error || !data) {
    return { status: "error" as const, message: error?.message ?? "Could not save newsletter." };
  }

  if (payload.publish) {
    await processNewsletterBroadcast(String(data.id));
    await processNotificationQueue(50);
  }

  revalidatePath("/admin/content");
  revalidatePath("/newsletters");
  revalidatePath(`/newsletters/${data.slug}`);

  return {
    status: "success" as const,
    data: {
      id: String(data.id),
      slug: String(data.slug),
      title: String(data.title),
      subject: String(data.subject),
      excerpt: String(data.excerpt ?? ""),
      body: String(data.body),
      status: data.status,
      publishedAt: data.published_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Newsletter,
  };
}

export async function adminCheckIn(input: AttendanceInput) {
  return checkInAttendance({ ...input, source: "admin" });
}

export async function writeAuditLog(action: string, entityType: string, entityId: string, preview: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle()
    : { data: null };
  await supabase.from("audit_logs").insert({
    actor_id: userId ?? null,
    actor_name: profile?.full_name || profile?.email || "Admin",
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata_preview: preview,
  });
}
