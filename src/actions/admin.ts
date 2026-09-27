"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { checkInAttendance } from "@/actions/public";
import {
  processCampaignQueue,
  processNewsletterBroadcast,
  processNotificationQueue,
} from "@/lib/notifications/process";
import { campaignScheduleSchema, ministerSchema, newsletterPublishSchema } from "@/lib/validation";
import { mapMinister } from "@/lib/ministers";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { renderRichEmailHtml } from "@/lib/notifications/email-template";
import { sendEmail } from "@/lib/notifications/providers";
import { labelRole, ROLE_DEFINITIONS } from "@/lib/admin";
import type { AttendanceInput, MockSubmitResult } from "@/services/contracts";
import type {
  AdminRole,
  AdminUser,
  Article,
  AttendanceRecord,
  AuditLog,
  AutomationRule,
  Campaign,
  Contact,
  ContactConsent,
  EventEdition,
  FaqItem,
  MessageTemplate,
  Minister,
  Newsletter,
  NewsletterSubscriber,
  Rsvp,
  VolunteerApplication,
  VolunteerStatus,
  WhatsAppSession,
} from "@/types";
import {
  adminUsers as mockAdminUsers,
  attendance as mockAttendance,
  auditLogs as mockAuditLogs,
  automations as mockAutomations,
  campaigns as mockCampaigns,
  consents as mockConsents,
  contacts as mockContacts,
  currentAdmin,
  rsvps as mockRsvps,
  templates as mockTemplates,
  volunteerApplications as mockVolunteers,
  whatsappSession as mockWhatsappSession,
} from "@/data/admin";
import { editions as mockEditions } from "@/data/editions";
import { ministers as mockMinisters } from "@/data/ministers";
import { articles as mockArticles } from "@/data/articles";
import { faqs as mockFaqs } from "@/data/faqs";

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
  ministers: Minister[];
  articles: Article[];
  faqs: FaqItem[];
  templates: MessageTemplate[];
  automations: AutomationRule[];
  auditLogs: AuditLog[];
  editions: EventEdition[];
  whatsappSession: WhatsAppSession | null;
  adminUsers: AdminUser[];
  systemHealth: {
    databaseConfigured: boolean;
    emailConfigured: boolean;
    emailCustomDomain: boolean;
    emailWebhookConfigured: boolean;
    cronConfigured: boolean;
    whatsAppConfigured: boolean;
    appUrl: string;
    sender: string;
  };
  error?: string;
};

function systemHealth(): AdminBundle["systemHealth"] {
  const sender = process.env.RESEND_FROM ?? "";
  return {
    databaseConfigured: isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    emailConfigured: Boolean(process.env.RESEND_API_KEY && sender),
    emailCustomDomain: Boolean(sender && !sender.toLowerCase().includes("resend.dev")),
    emailWebhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET),
    cronConfigured: Boolean(process.env.CRON_SECRET),
    whatsAppConfigured: Boolean(process.env.OPENWA_BASE_URL && process.env.OPENWA_API_KEY),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "",
    sender,
  };
}

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

function mapArticle(row: Record<string, unknown>): Article {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ""),
    body: Array.isArray(row.body) ? (row.body as string[]) : [],
    coverImageSrc: String(row.cover_image_src ?? ""),
    coverImageAlt: String(row.cover_image_alt ?? ""),
    author: String(row.author ?? ""),
    authorRole: String(row.author_role ?? ""),
    category: String(row.category ?? "General"),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    status: (row.status as Article["status"]) ?? "draft",
    publishedAt: String(row.published_at ?? row.created_at ?? ""),
    seoTitle: String(row.seo_title ?? ""),
    seoDescription: String(row.seo_description ?? ""),
  };
}

function mapFaq(row: Record<string, unknown>): FaqItem {
  const nested = row.event_editions as Record<string, unknown> | null;
  return {
    id: String(row.id),
    editionId: nested?.legacy_key
      ? String(nested.legacy_key)
      : row.edition_id
      ? String(row.edition_id)
      : null,
    category: (row.category as FaqItem["category"]) ?? "general",
    question: String(row.question),
    answer: String(row.answer),
    order: Number(row.sort_order ?? 1),
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
    ministers: [],
    articles: [],
    faqs: [],
    templates: [],
    automations: [],
    auditLogs: [],
    editions: [],
    whatsappSession: null,
    adminUsers: [],
    systemHealth: systemHealth(),
    error,
  };
}

export async function loadAdminBundle(): Promise<AdminBundle> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    if (isSupabaseConfigured()) {
      return emptyBundle("Your admin session has expired. Sign in again.");
    }
    return {
      profile: currentAdmin,
      contacts: mockContacts,
      consents: mockConsents,
      rsvps: mockRsvps,
      attendance: mockAttendance,
      volunteers: mockVolunteers,
      campaigns: mockCampaigns,
      newsletters: [],
      newsletterSubscribers: [],
      ministers: mockMinisters,
      articles: mockArticles,
      faqs: mockFaqs,
      templates: mockTemplates,
      automations: mockAutomations,
      auditLogs: mockAuditLogs,
      editions: mockEditions,
      whatsappSession: mockWhatsappSession,
      adminUsers: mockAdminUsers,
      systemHealth: systemHealth(),
    };
  }

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
    ministersRes,
    articlesRes,
    faqsRes,
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
    supabase.from("ministers").select("*, event_editions(legacy_key)").order("sort_order"),
    supabase.from("articles").select("*").order("created_at", { ascending: false }),
    supabase.from("faqs").select("*, event_editions(legacy_key)").order("sort_order", { ascending: true }),
  ]);

  const firstError =
    profileRes.error ||
    rolesRes.error ||
    contactsRes.error ||
    rsvpsRes.error ||
    ministersRes.error;

  if (rolesRes.error || !rolesRes.data?.length) {
    return emptyBundle("This account does not have an admin role.");
  }

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
    ministers: ((ministersRes.data as Record<string, unknown>[] | null) ?? []).map(mapMinister),
    articles: articlesRes.data && articlesRes.data.length > 0
      ? (articlesRes.data as Record<string, unknown>[]).map(mapArticle)
      : mockArticles,
    faqs: faqsRes.data && faqsRes.data.length > 0
      ? (faqsRes.data as Record<string, unknown>[]).map(mapFaq)
      : mockFaqs,
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
      department: String(row.department || "General"),
      phone: row.phone ? String(row.phone) : null,
      status: (row.status as AdminUser["status"]) ?? "active",
      createdAt: String(row.created_at || ""),
      lastSignInAt: row.last_sign_in_at ? String(row.last_sign_in_at) : null,
    })),
    systemHealth: systemHealth(),
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
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

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

  if (userId) {
    await supabase.from("audit_logs").insert({
      actor_id: userId,
      actor_name: "Admin",
      action: "Updated event edition",
      entity_type: "event_edition",
      entity_id: edition.id,
      metadata_preview: `${edition.name} (${edition.status})`,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/events");
  revalidatePath(`/attend/${edition.year}`);

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
  const userId = (claimsData?.claims?.sub as string | undefined) ?? currentAdmin.id;

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
  const userId = (claimsData?.claims?.sub as string | undefined) ?? currentAdmin.id;

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

export async function saveMinisterAction(formData: FormData) {
  const parsed = ministerSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    editionId: String(formData.get("editionId") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    imageSrc: String(formData.get("imageSrc") ?? "") || undefined,
    imageAlt: String(formData.get("imageAlt") ?? "") || undefined,
    featured: formData.get("featured") === "true",
    published: formData.get("published") === "true",
    order: Number(formData.get("order") ?? 1),
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
  if (!userId) {
    return { status: "error" as const, message: "Sign in to update ministers." };
  }

  const input = parsed.data;
  const { data: edition, error: editionError } = await supabase
    .from("event_editions")
    .select("id, legacy_key")
    .eq("legacy_key", input.editionId)
    .maybeSingle();

  if (editionError || !edition) {
    return { status: "error" as const, message: editionError?.message ?? "Edition not found." };
  }

  let imageSrc = input.imageSrc ?? "";
  let uploadedPath: string | null = null;
  const image = formData.get("image");
  if (image && typeof image !== "string" && image.size > 0) {
    const allowedTypes = new Map([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
    ]);
    const extension = allowedTypes.get(image.type);
    if (!extension) {
      return { status: "validation" as const, errors: [{ field: "image", message: "Upload a JPG, PNG, or WebP image." }] };
    }
    if (image.size > 5 * 1024 * 1024) {
      return { status: "validation" as const, errors: [{ field: "image", message: "Keep the image under 5 MB." }] };
    }

    uploadedPath = `${input.editionId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("minister-images")
      .upload(uploadedPath, await image.arrayBuffer(), {
        contentType: image.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return { status: "error" as const, message: uploadError.message };
    }
    imageSrc = supabase.storage.from("minister-images").getPublicUrl(uploadedPath).data.publicUrl;
  }

  if (!imageSrc) {
    return { status: "validation" as const, errors: [{ field: "image", message: "Add a portrait before saving." }] };
  }

  const id = input.id ?? `min-${crypto.randomUUID()}`;
  const row = {
    id,
    edition_id: edition.id,
    name: input.name,
    role: input.role,
    bio: input.bio,
    image_src: imageSrc,
    image_alt: input.imageAlt || `Portrait of ${input.name}`,
    featured: input.featured,
    is_published: input.published,
    sort_order: input.order,
  };

  const request = input.id
    ? supabase.from("ministers").update(row).eq("id", input.id)
    : supabase.from("ministers").insert(row);
  const { data, error } = await request
    .select("*, event_editions(legacy_key)")
    .maybeSingle();

  if (error || !data) {
    if (uploadedPath) {
      await supabase.storage.from("minister-images").remove([uploadedPath]);
    }
    return { status: "error" as const, message: error?.message ?? "Could not save the minister." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: input.id ? "Updated minister" : "Created minister",
    entity_type: "minister",
    entity_id: id,
    metadata_preview: `${input.name} / ${input.published ? "published" : "draft"}`,
  });

  revalidatePath("/");
  revalidatePath("/admin/content");

  return { status: "success" as const, data: mapMinister(data as Record<string, unknown>) };
}

export async function deleteMinisterAction(id: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return { status: "error" as const, message: "Sign in to delete ministers." };
  }

  const { error } = await supabase.from("ministers").delete().eq("id", id);
  if (error) {
    return { status: "error" as const, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: "Deleted minister",
    entity_type: "minister",
    entity_id: id,
    metadata_preview: `Deleted minister ${id}`,
  });

  revalidatePath("/");
  revalidatePath("/admin/content");

  return { status: "success" as const };
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

export async function getAdminFlyerTemplateAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flyer_templates")
    .select("id, name, file_name, mime_type, image_url, is_published, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    fileName: data.file_name,
    mimeType: data.mime_type,
    imageUrl: data.image_url,
    published: data.is_published,
    updatedAt: data.updated_at,
  };
}

export async function saveFlyerTemplateAction(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return { status: "error" as const, message: "Sign in to publish flyer templates." };
  }

  const { data: roles } = await supabase.from("profile_roles").select("role").eq("profile_id", userId);
  if (!roles?.length) {
    return { status: "error" as const, message: "You do not have permission to manage flyer templates." };
  }

  const name = String(formData.get("name") ?? "Main attending flyer").trim() || "Main attending flyer";
  const file = formData.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return { status: "error" as const, message: "Please select an image file to upload." };
  }

  const allowedTypes = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]);
  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return { status: "error" as const, message: "Upload a JPG, PNG, or WebP image." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { status: "error" as const, message: "Keep the flyer under 10 MB." };
  }

  const storagePath = `templates/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("flyer-templates")
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) {
    return { status: "error" as const, message: `Storage error: ${uploadError.message}` };
  }

  const imageUrl = supabase.storage.from("flyer-templates").getPublicUrl(storagePath).data.publicUrl;

  await supabase.from("flyer_templates").update({ is_published: false }).eq("is_published", true);

  const { data, error } = await supabase
    .from("flyer_templates")
    .upsert({
      id: "active-attending-flyer",
      name,
      file_name: file.name,
      mime_type: file.type,
      image_url: imageUrl,
      storage_path: storagePath,
      is_published: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    return { status: "error" as const, message: error?.message ?? "Could not save flyer template metadata." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: "Published flyer template",
    entity_type: "flyer_template",
    entity_id: "active-attending-flyer",
    metadata_preview: `${name} / ${file.name}`,
  });

  revalidatePath("/flyer");
  revalidatePath("/admin/flyer");

  return {
    status: "success" as const,
    data: {
      id: data.id,
      name: data.name,
      fileName: data.file_name,
      mimeType: data.mime_type,
      imageUrl: data.image_url,
      published: data.is_published,
      updatedAt: data.updated_at,
    },
  };
}

export async function unpublishFlyerTemplateAction() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return { status: "error" as const, message: "Sign in to manage flyer templates." };
  }

  const { error } = await supabase
    .from("flyer_templates")
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq("id", "active-attending-flyer");

  if (error) {
    return { status: "error" as const, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: "Unpublished flyer template",
    entity_type: "flyer_template",
    entity_id: "active-attending-flyer",
    metadata_preview: "Unpublished active flyer template",
  });

  revalidatePath("/flyer");
  revalidatePath("/admin/flyer");

  return { status: "success" as const };
}

export async function saveArticleAction(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return { status: "error" as const, message: "Sign in to manage articles." };
  }

  const { data: roles } = await supabase.from("profile_roles").select("role").eq("profile_id", userId);
  if (!roles?.length) {
    return { status: "error" as const, message: "You do not have permission to manage articles." };
  }

  const idInput = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { status: "validation" as const, errors: [{ field: "title", message: "Enter an article title." }] };
  }

  let slug = String(formData.get("slug") ?? "").trim();
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const bodyRaw = String(formData.get("body") ?? "");
  const body = bodyRaw
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const author = String(formData.get("author") ?? "Abraham Oyo-Ita").trim() || "Abraham Oyo-Ita";
  const authorRole = String(formData.get("authorRole") ?? "Communications lead").trim();
  const category = String(formData.get("category") ?? "General").trim() || "General";
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const status = (String(formData.get("status") ?? "published").trim() as Article["status"]) || "published";
  const publishedAt = String(formData.get("publishedAt") ?? "").trim() || new Date().toISOString();
  const seoTitle = String(formData.get("seoTitle") ?? "").trim() || `${title} | Wonders of Worship Experience`;
  const seoDescription = String(formData.get("seoDescription") ?? "").trim() || excerpt;
  const coverImageAlt = String(formData.get("coverImageAlt") ?? "").trim() || title;

  let coverImageSrc = String(formData.get("coverImageSrc") ?? "").trim();
  const image = formData.get("image");

  let uploadedPath: string | null = null;
  if (image && typeof image !== "string" && image.size > 0) {
    const allowedTypes = new Map([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
    ]);
    const extension = allowedTypes.get(image.type);
    if (!extension) {
      return { status: "validation" as const, errors: [{ field: "image", message: "Upload a JPG, PNG, or WebP cover image." }] };
    }
    if (image.size > 5 * 1024 * 1024) {
      return { status: "validation" as const, errors: [{ field: "image", message: "Cover image must be 5 MB or smaller." }] };
    }

    uploadedPath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("article-covers")
      .upload(uploadedPath, await image.arrayBuffer(), {
        contentType: image.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return { status: "error" as const, message: uploadError.message };
    }
    coverImageSrc = supabase.storage.from("article-covers").getPublicUrl(uploadedPath).data.publicUrl;
  }

  if (!coverImageSrc) {
    coverImageSrc = "/images/insight-posture.jpg";
  }

  const id = idInput || `art-${crypto.randomUUID()}`;
  const row = {
    id,
    slug,
    title,
    excerpt,
    body,
    cover_image_src: coverImageSrc,
    cover_image_alt: coverImageAlt,
    author,
    author_role: authorRole,
    category,
    tags,
    status,
    published_at: publishedAt,
    seo_title: seoTitle,
    seo_description: seoDescription,
    updated_at: new Date().toISOString(),
  };

  const query = idInput
    ? supabase.from("articles").update(row).eq("id", idInput)
    : supabase.from("articles").insert(row);

  const { data, error } = await query.select().maybeSingle();
  if (error || !data) {
    if (uploadedPath) {
      await supabase.storage.from("article-covers").remove([uploadedPath]);
    }
    return { status: "error" as const, message: error?.message ?? "Could not save article." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: idInput ? "Updated article" : "Created article",
    entity_type: "article",
    entity_id: id,
    metadata_preview: `${title} (${status})`,
  });

  revalidatePath("/insights");
  revalidatePath(`/insights/${slug}`);
  revalidatePath("/admin/content");

  return { status: "success" as const, data: mapArticle(data as Record<string, unknown>) };
}

export async function deleteArticleAction(id: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return { status: "error" as const, message: "Sign in to delete articles." };
  }

  const { data: roles } = await supabase.from("profile_roles").select("role").eq("profile_id", userId);
  if (!roles?.length) {
    return { status: "error" as const, message: "You do not have permission to delete articles." };
  }

  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) {
    return { status: "error" as const, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: "Deleted article",
    entity_type: "article",
    entity_id: id,
    metadata_preview: `Deleted article ${id}`,
  });

  revalidatePath("/insights");
  revalidatePath("/admin/content");

  return { status: "success" as const };
}

export async function saveFaqAction(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return { status: "error" as const, message: "Sign in to manage FAQs." };
  }

  const { data: roles } = await supabase.from("profile_roles").select("role").eq("profile_id", userId);
  if (!roles?.length) {
    return { status: "error" as const, message: "You do not have permission to manage FAQs." };
  }

  const idInput = String(formData.get("id") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const order = Number(formData.get("order") ?? 1);
  const editionInput = String(formData.get("editionId") ?? "").trim();

  if (!question) {
    return { status: "validation" as const, errors: [{ field: "question", message: "Enter a question." }] };
  }
  if (!answer) {
    return { status: "validation" as const, errors: [{ field: "answer", message: "Enter an answer." }] };
  }

  let editionUuid: string | null = null;
  if (editionInput) {
    const { data: edition } = await supabase
      .from("event_editions")
      .select("id")
      .or(`id.eq.${editionInput},legacy_key.eq.${editionInput}`)
      .maybeSingle();
    editionUuid = edition?.id ?? null;
  }

  const id = idInput || `faq-${crypto.randomUUID()}`;
  const row = {
    id,
    edition_id: editionUuid,
    category,
    question,
    answer,
    sort_order: order,
    is_published: true,
    updated_at: new Date().toISOString(),
  };

  const query = idInput
    ? supabase.from("faqs").update(row).eq("id", idInput)
    : supabase.from("faqs").insert(row);

  const { data, error } = await query
    .select("*, event_editions(legacy_key)")
    .maybeSingle();

  if (error || !data) {
    return { status: "error" as const, message: error?.message ?? "Could not save FAQ." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: idInput ? "Updated FAQ" : "Created FAQ",
    entity_type: "faq",
    entity_id: id,
    metadata_preview: `${question.slice(0, 60)}...`,
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/events");
  revalidatePath("/volunteer");

  return { status: "success" as const, data: mapFaq(data as Record<string, unknown>) };
}

export async function deleteFaqAction(id: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return { status: "error" as const, message: "Sign in to delete FAQs." };
  }

  const { data: roles } = await supabase.from("profile_roles").select("role").eq("profile_id", userId);
  if (!roles?.length) {
    return { status: "error" as const, message: "You do not have permission to delete FAQs." };
  }

  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) {
    return { status: "error" as const, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_name: "Admin",
    action: "Deleted FAQ",
    entity_type: "faq",
    entity_id: id,
    metadata_preview: `Deleted FAQ ${id}`,
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/events");
  revalidatePath("/volunteer");

  return { status: "success" as const };
}

/**
 * --------------------------------------------------------------------------------
 * TEAM MANAGEMENT & SUPER SENIOR RBAC ACTIONS
 * --------------------------------------------------------------------------------
 */

export async function loadTeamMembersAction(): Promise<{
  members: AdminUser[];
  error?: string;
}> {
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    return { members: mockAdminUsers };
  }

  const admin = createAdminClient();
  try {
    const [authUsersRes, profilesRes, rolesRes] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("profiles").select("*"),
      admin.from("profile_roles").select("*"),
    ]);

    const roleByProfile = new Map<string, AdminRole>();
    for (const r of (rolesRes.data ?? [])) {
      roleByProfile.set(r.profile_id, r.role as AdminRole);
    }

    const profileById = new Map<string, Record<string, unknown>>();
    for (const p of (profilesRes.data ?? [])) {
      profileById.set(p.id, p);
    }

    const members: AdminUser[] = [];
    const users = authUsersRes.data?.users ?? [];

    for (const u of users) {
      const p = profileById.get(u.id);
      const role = roleByProfile.get(u.id) || (u.user_metadata?.role as AdminRole) || "scanner_usher";
      const name = String(p?.full_name || u.user_metadata?.full_name || u.email?.split("@")[0] || "Staff Member");
      const department = String(p?.department || u.user_metadata?.department || "Executive Leadership");
      const status = (p?.status as AdminUser["status"]) || (u.invited_at && !u.last_sign_in_at ? "invited" : "active");

      members.push({
        id: u.id,
        name,
        email: u.email ?? "",
        role,
        department,
        phone: (p?.phone as string) || (u.phone as string) || null,
        status,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }

    return { members };
  } catch (err) {
    console.error("Failed to load team members", err);
    return { members: mockAdminUsers, error: err instanceof Error ? err.message : "Failed to load team" };
  }
}

export async function inviteTeamMemberAction(input: {
  email: string;
  fullName: string;
  role: AdminRole;
  department: string;
  notes?: string;
}): Promise<{
  status: "success" | "error";
  message?: string;
  inviteLink?: string;
  member?: AdminUser;
}> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (!input.fullName.trim()) {
    return { status: "error", message: "Please enter the member's full name." };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const callerId = claimsData?.claims?.sub as string | undefined;
  const callerEmail = claimsData?.claims?.email as string | undefined;

  const { data: callerRoles } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", callerId ?? "");

  const callerRole = callerRoles?.[0]?.role as AdminRole | undefined;
  const isSuperAdmin = callerRole === "super_admin";
  const isEventAdmin = callerRole === "event_admin";

  if (!isSuperAdmin && !isEventAdmin) {
    return { status: "error", message: "You do not have permission to invite team members." };
  }

  if (!isSuperAdmin && input.role === "super_admin") {
    return { status: "error", message: "Only Super Admins can appoint another Super Admin." };
  }

  const admin = createAdminClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://www.wowexperience.com.ng";
  const redirectTo = `${origin}/admin/set-password`;

  try {
    const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = userList?.users?.find((u) => u.email?.toLowerCase() === email);

    let userId = existing?.id;
    let inviteLink = "";

    if (existing) {
      userId = existing.id;
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo,
          data: {
            full_name: input.fullName,
            role: input.role,
            department: input.department,
          },
        },
      });
      if (linkErr) throw linkErr;
      inviteLink = linkData.properties.action_link;
    } else {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          redirectTo,
          data: {
            full_name: input.fullName,
            role: input.role,
            department: input.department,
          },
        },
      });
      if (linkErr) {
        const { data: invData, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: {
            full_name: input.fullName,
            role: input.role,
            department: input.department,
          },
        });
        if (invErr) throw invErr;
        userId = invData.user.id;
      } else {
        inviteLink = linkData.properties.action_link;
        userId = linkData.user.id;
      }
    }

    // Upsert profile
    await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: input.fullName,
      department: input.department,
      status: "invited",
    });

    // Upsert profile_role
    await admin.from("profile_roles").upsert({
      profile_id: userId,
      role: input.role,
    });

    // Attempt to log in team_invitations table
    try {
      await admin.from("team_invitations").insert({
        email,
        full_name: input.fullName,
        role: input.role,
        department: input.department,
        invited_by_id: callerId,
        invited_by_name: callerEmail || "Super Admin",
        token: crypto.randomUUID(),
        invite_url: inviteLink,
        notes: input.notes ?? null,
        status: "pending",
      });
    } catch {
      // Table may be pending migration
    }

    // Send custom luxury invitation email via Resend
    const roleDef = ROLE_DEFINITIONS[input.role] || ROLE_DEFINITIONS.content_editor;
    const inviteHtml = renderRichEmailHtml({
      title: "Invitation to WOW Experience Team",
      preheader: `You have been appointed as ${roleDef.label} in ${input.department}.`,
      badgeText: `${input.department.toUpperCase()} • APPOINTMENT`,
      headline: `Welcome to the Workforce, ${input.fullName}!`,
      leadParagraph: `You have been appointed to join the administrative and leadership team for Wonders of Worship Experience.`,
      detailsGrid: [
        { label: "Appointed Role", value: roleDef.label, badge: "Authorized" },
        { label: "Department", value: input.department },
        { label: "Access Tier", value: roleDef.tierLabel },
      ],
      callout: {
        type: "gold",
        title: "ROLE MANDATE & CAPABILITIES",
        text: roleDef.description,
      },
      primaryAction: inviteLink
        ? {
            text: "Accept Invitation & Set Password",
            url: inviteLink,
          }
        : undefined,
      venueCard: true,
      scriptureQuote: true,
      recipientEmail: email,
    });

    await sendEmail({
      id: crypto.randomUUID(),
      channel: "email",
      to: email,
      subject: `You have been appointed to the WOW Experience Team (${input.department})`,
      body: `Dear ${input.fullName}, you have been appointed to the WOW Experience team as ${roleDef.label}. Follow your invitation link: ${inviteLink}`,
      html: inviteHtml,
    });

    // Audit log
    await admin.from("audit_logs").insert({
      actor_id: callerId,
      actor_name: callerEmail || "Admin",
      action: "team.invited_member",
      entity_type: "team_member",
      entity_id: userId,
      metadata_preview: `Invited ${input.fullName} (${email}) as ${roleDef.label} in ${input.department}`,
    });

    revalidatePath("/admin/team");
    revalidatePath("/admin");

    return {
      status: "success",
      inviteLink,
      member: {
        id: userId!,
        name: input.fullName,
        email,
        role: input.role,
        department: input.department,
        status: "invited",
        inviteUrl: inviteLink,
      },
    };
  } catch (err) {
    console.error("Invite team member error:", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to invite team member",
    };
  }
}

export async function updateTeamMemberRoleAction(input: {
  userId: string;
  role: AdminRole;
  department?: string;
  status?: "active" | "invited" | "disabled";
}): Promise<{ status: "success" | "error"; message?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const callerId = claimsData?.claims?.sub as string | undefined;

  const { data: callerRoles } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", callerId ?? "");

  const callerRole = callerRoles?.[0]?.role as AdminRole | undefined;
  if (callerRole !== "super_admin" && callerRole !== "event_admin") {
    return { status: "error", message: "Only administrators can update team roles." };
  }

  const admin = createAdminClient();
  const { data: targetUser } = await admin.auth.admin.getUserById(input.userId);
  const targetEmail = targetUser?.user?.email?.toLowerCase();

  // Guard: Cannot demote primary super admin
  if (targetEmail === "oyoitaabraham@gmail.com" && input.role !== "super_admin") {
    return { status: "error", message: "The primary Super Admin cannot be demoted." };
  }

  // Guard: If caller is demoting self, make sure another super admin exists
  if (callerId === input.userId && input.role !== "super_admin") {
    const { data: allSupers } = await admin
      .from("profile_roles")
      .select("profile_id")
      .eq("role", "super_admin");
    if (!allSupers || allSupers.length <= 1) {
      return { status: "error", message: "Cannot demote yourself: at least one Super Admin must remain active." };
    }
  }

  // Update role
  await admin.from("profile_roles").upsert({
    profile_id: input.userId,
    role: input.role,
  });

  // Update profile
  const profileUpdates: Record<string, unknown> = {};
  if (input.department) profileUpdates.department = input.department;
  if (input.status) profileUpdates.status = input.status;
  if (Object.keys(profileUpdates).length) {
    await admin.from("profiles").update(profileUpdates).eq("id", input.userId);
  }

  // Update user_metadata in auth
  await admin.auth.admin.updateUserById(input.userId, {
    user_metadata: {
      role: input.role,
      ...(input.department ? { department: input.department } : {}),
    },
  });

  // Audit log
  await admin.from("audit_logs").insert({
    actor_id: callerId,
    actor_name: claimsData?.claims?.email || "Admin",
    action: "team.updated_role",
    entity_type: "team_member",
    entity_id: input.userId,
    metadata_preview: `Updated ${targetEmail} to role ${labelRole(input.role)} (${input.department ?? "No dept change"})`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin");

  return { status: "success" };
}

export async function deleteTeamMemberAction(input: {
  userId: string;
}): Promise<{ status: "success" | "error"; message?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const callerId = claimsData?.claims?.sub as string | undefined;

  const { data: callerRoles } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", callerId ?? "");

  if (callerRoles?.[0]?.role !== "super_admin") {
    return { status: "error", message: "Only Super Admins can remove team members." };
  }

  if (callerId === input.userId) {
    return { status: "error", message: "You cannot remove your own account." };
  }

  const admin = createAdminClient();
  const { data: targetUser } = await admin.auth.admin.getUserById(input.userId);
  const targetEmail = targetUser?.user?.email?.toLowerCase();

  if (targetEmail === "oyoitaabraham@gmail.com") {
    return { status: "error", message: "The primary Super Admin cannot be removed." };
  }

  await admin.from("profile_roles").delete().eq("profile_id", input.userId);
  await admin.from("profiles").delete().eq("id", input.userId);
  await admin.auth.admin.deleteUser(input.userId);

  await admin.from("audit_logs").insert({
    actor_id: callerId,
    actor_name: claimsData?.claims?.email || "Super Admin",
    action: "team.removed_member",
    entity_type: "team_member",
    entity_id: input.userId,
    metadata_preview: `Removed member ${targetEmail}`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin");

  return { status: "success" };
}

export async function resendTeamInviteAction(input: {
  userId: string;
  email: string;
}): Promise<{ status: "success" | "error"; message?: string; inviteLink?: string }> {
  const admin = createAdminClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://www.wowexperience.com.ng";
  const redirectTo = `${origin}/admin/set-password`;

  try {
    const { data: profile } = await admin.from("profiles").select("*").eq("id", input.userId).maybeSingle();
    const { data: roles } = await admin.from("profile_roles").select("role").eq("profile_id", input.userId);
    const role = (roles?.[0]?.role as AdminRole) || "content_editor";
    const fullName = String(profile?.full_name || input.email.split("@")[0]);
    const department = String(profile?.department || "General");

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: input.email,
      options: { redirectTo, data: { full_name: fullName, role, department } },
    });
    if (linkErr) throw linkErr;

    const inviteLink = linkData.properties.action_link;
    const roleDef = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.content_editor;

    const inviteHtml = renderRichEmailHtml({
      title: "WOW Experience Team Invitation (Reminder)",
      preheader: `Reminder: You have an active invitation to join the WOW Experience Team.`,
      badgeText: `${department.toUpperCase()} • INVITATION REMINDER`,
      headline: `Invitation Reminder: Welcome to the Workforce, ${fullName}!`,
      leadParagraph: `This is a reminder that your administrative credential link is active. Click below to accept and set up your password.`,
      detailsGrid: [
        { label: "Appointed Role", value: roleDef.label, badge: "Pending" },
        { label: "Department", value: department },
        { label: "Access Tier", value: roleDef.tierLabel },
      ],
      primaryAction: {
        text: "Accept Invitation & Set Password",
        url: inviteLink,
      },
      venueCard: true,
      scriptureQuote: true,
      recipientEmail: input.email,
    });

    await sendEmail({
      id: crypto.randomUUID(),
      channel: "email",
      to: input.email,
      subject: `Invitation Reminder: WOW Experience Team (${department})`,
      body: `Dear ${fullName}, your invitation to the WOW Experience team as ${roleDef.label} is ready: ${inviteLink}`,
      html: inviteHtml,
    });

    return { status: "success", inviteLink };
  } catch (err) {
    console.error("Resend invite error:", err);
    return { status: "error", message: err instanceof Error ? err.message : "Failed to resend invite" };
  }
}


