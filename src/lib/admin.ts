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
    super_admin: "Super admin",
    event_admin: "Event admin",
    communications_manager: "Communications",
    content_editor: "Content editor",
  };
  return map[role];
}

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
