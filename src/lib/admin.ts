import { consents as mockConsents, contacts as mockContacts } from "@/data/admin";
import { volunteerTeams } from "@/data/content";
import { editions, getEditionByYear } from "@/data/editions";
import type {
  AdminRole,
  CampaignStatus,
  Channel,
  Contact,
  ContactConsent,
  EditionStatus,
  EventEdition,
} from "@/types";

let liveContacts: Contact[] | null = null;
let liveConsents: ContactConsent[] | null = null;

export function setAdminLookups(next: { contacts: Contact[]; consents: ContactConsent[] }) {
  liveContacts = next.contacts;
  liveConsents = next.consents;
}

function contacts() {
  return liveContacts ?? mockContacts;
}

function consents() {
  return liveConsents ?? mockConsents;
}

export const ADMIN_YEARS = [2025, 2026, 2027] as const;
export const DEFAULT_ADMIN_YEAR = 2026;
export const ADMIN_TZ = "Africa/Lagos";

const EXTRA_TEAM_LABELS: Record<string, string> = {
  team_media: "Media",
  team_usher: "Ushering",
  team_welcome: "Welcome",
  team_hospitality: "Hospitality",
  team_prayer: "Prayer",
  "team-hospitality": "Hospitality",
  "team-worship": "Worship team",
  "team-media": "Media",
  "team-prayer": "Prayer",
  "team-logistics": "Logistics",
};

export function editionEventIds(edition: EventEdition) {
  return new Set([
    edition.id,
    edition.slug,
    `edt_${edition.year}`,
    `edition-${edition.year}`,
    String(edition.year),
  ]);
}

export function inEdition(eventId: string, edition: EventEdition) {
  return editionEventIds(edition).has(eventId);
}

export function editionForYear(year: number) {
  return getEditionByYear(year) ?? editions[0];
}

export function contactById(id: string) {
  return contacts().find((row) => row.id === id);
}

export function contactName(id: string) {
  const contact = contactById(id);
  return contact ? `${contact.firstName} ${contact.lastName}` : "Unknown guest";
}

export function contactEmail(id: string) {
  return contactById(id)?.email ?? "No email";
}

export function contactPhone(id: string) {
  return contactById(id)?.phone ?? "";
}

export function teamLabel(teamId: string) {
  const fromContent = volunteerTeams.find((team) => team.id === teamId);
  return fromContent?.name ?? EXTRA_TEAM_LABELS[teamId] ?? teamId;
}

export function consentSummary(contactId: string) {
  const rows = consents().filter((row) => row.contactId === contactId);
  if (!rows.length) return "None recorded";
  const granted = rows.filter((row) => row.status === "granted");
  if (!granted.length) return "Revoked";
  return granted.map((row) => labelChannel(row.channel)).join(", ");
}

export function hasGrantedConsent(
  contactId: string,
  channel?: "whatsapp" | "email",
) {
  return consents().some(
    (row) =>
      row.contactId === contactId &&
      row.status === "granted" &&
      (!channel || row.channel === channel),
  );
}

export function labelChannel(channel: Channel | "whatsapp" | "email") {
  if (channel === "both") return "WhatsApp + email";
  if (channel === "whatsapp") return "WhatsApp";
  return "Email";
}

export function labelRole(role: AdminRole) {
  const map: Record<AdminRole, string> = {
    super_admin: "Super Admin",
    event_admin: "Event Director",
    communications_manager: "Communications Lead",
    content_editor: "Content Editor",
    workforce_coordinator: "Workforce Coordinator",
    scanner_usher: "Check-in Usher / Scanner",
  };
  return map[role] ?? role;
}

export interface RoleDefinition {
  role: AdminRole;
  label: string;
  tier: number;
  tierLabel: string;
  badgeClass: string;
  description: string;
  permissions: string[];
}

export const ROLE_DEFINITIONS: Record<AdminRole, RoleDefinition> = {
  super_admin: {
    role: "super_admin",
    label: "Super Admin",
    tier: 1,
    tierLabel: "Tier 1 • Full Authority",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10",
    description: "Executive system control. Can invite and manage team members, edit roles, access audit logs, manage database and configuration.",
    permissions: [
      "Manage team & RBAC roles",
      "Full access to all event editions",
      "System audit log review",
      "Platform configuration & API keys",
      "Broadcast & campaign dispatch",
      "Content & media management",
    ],
  },
  event_admin: {
    role: "event_admin",
    label: "Event Director",
    tier: 2,
    tierLabel: "Tier 2 • Operational Authority",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10",
    description: "Operational leadership. Manages event editions, attendee registrations, workforce teams, and communications.",
    permissions: [
      "Invite staff (Tiers 3-5)",
      "Manage event editions & schedules",
      "Attendee RSVPs & attendance tracking",
      "Volunteer team coordination",
      "Campaign broadcast approval",
    ],
  },
  communications_manager: {
    role: "communications_manager",
    label: "Communications Lead",
    tier: 3,
    tierLabel: "Tier 3 • Public Outreach",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-500/10",
    description: "Manages public communications, email/WhatsApp broadcasts, attendee newsletters, and message templates.",
    permissions: [
      "Create & schedule broadcast campaigns",
      "Manage email & WhatsApp templates",
      "View audience contacts & consent records",
      "Export attendee communication lists",
    ],
  },
  content_editor: {
    role: "content_editor",
    label: "Content & Media Editor",
    tier: 3,
    tierLabel: "Tier 3 • Creative & Editorial",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10",
    description: "Responsible for editorial insights, church FAQs, flyer graphics generation, minister lineups, and gallery uploads.",
    permissions: [
      "Create & edit published articles / insights",
      "Manage church FAQs & categories",
      "Configure flyer templates & badges",
      "Upload gallery photos & minister profiles",
    ],
  },
  workforce_coordinator: {
    role: "workforce_coordinator",
    label: "Workforce Coordinator",
    tier: 4,
    tierLabel: "Tier 4 • Department Coordination",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/10",
    description: "Oversees workforce departments (Ushering, Sound & Media, Choir, Security, Protocol). Reviews applications and assigns roles.",
    permissions: [
      "Review volunteer applications",
      "Assign volunteers to departments",
      "Export department rosters",
      "Monitor workforce check-in status",
    ],
  },
  scanner_usher: {
    role: "scanner_usher",
    label: "Check-in Usher / Scanner",
    tier: 5,
    tierLabel: "Tier 5 • Sanctuary Field Access",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200 ring-1 ring-zinc-500/10",
    description: "Event day sanctuary check-in. Scans QR passes and checks in attendees at Sanctified Mount Zion Church.",
    permissions: [
      "QR code pass scanner access",
      "Lookup attendee check-in status",
      "Mark manual attendance on event day",
    ],
  },
};

export function labelEditionStatus(status: EditionStatus) {
  const map: Record<EditionStatus, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    published: "Published",
    live: "Live",
    completed: "Completed",
    archived: "Archived",
  };
  return map[status];
}

export function labelCampaignStatus(status: CampaignStatus | string) {
  const map: Record<string, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    queueing: "Queueing",
    sending: "Sending",
    completed: "Completed",
    cancelled: "Cancelled",
    failed: "Failed",
  };
  return map[status] ?? status;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function maskGroupLink(value: string) {
  return value.replaceAll(
    "{{whatsapp_group_url}}",
    "Link stored in settings, not shown on public pages",
  );
}
