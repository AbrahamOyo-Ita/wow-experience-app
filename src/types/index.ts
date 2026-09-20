export type EditionStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "live"
  | "completed"
  | "archived";

export type Channel = "whatsapp" | "email" | "both";

export type ConsentStatus = "granted" | "revoked";

export type RsvpResponse = "attending" | "not_attending";

export type VolunteerStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "declined";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "queueing"
  | "sending"
  | "completed"
  | "cancelled"
  | "failed";

export type CampaignChannelMode = "whatsapp" | "email" | "both" | "fallback";

export type NotificationStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "failed"
  | "skipped"
  | "cancelled";

export type WhatsAppSessionStatus =
  | "connected"
  | "disconnected"
  | "qr_required"
  | "connecting"
  | "degraded"
  | "rate_limited";

export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

export type NewsletterStatus = "draft" | "published" | "archived";

export type AdminRole =
  | "super_admin"
  | "event_admin"
  | "communications_manager"
  | "content_editor";

export interface Venue {
  name: string;
  address: string;
  city: string;
  country: string;
  directionsUrl: string;
  notes: string;
}

export interface EventEdition {
  id: string;
  year: number;
  name: string;
  shortName: string;
  slug: string;
  theme: string;
  statement: string;
  description: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  doorsAt: string;
  venue: Venue;
  status: EditionStatus;
  publishedAt: string | null;
  galleryDriveUrl: string;
  attendanceUrl: string;
  attendanceWindowStartsAt: string;
  attendanceWindowEndsAt: string;
  reminderTwoDayEnabled: boolean;
  reminderEventDayEnabled: boolean;
  reminderEventDayTime: string;
  qrTargetUrl: string;
  isDatePlaceholder?: boolean;
  isVenuePlaceholder?: boolean;
}

export interface Minister {
  id: string;
  editionId: string;
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  imageAlt: string;
  featured: boolean;
  published?: boolean;
  order: number;
}

export interface ScheduleItem {
  id: string;
  editionId: string;
  startsAt: string;
  endsAt: string;
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  editionId: string | null;
  category:
    | "venue"
    | "time"
    | "entry"
    | "what_to_bring"
    | "children"
    | "accessibility"
    | "parking"
    | "contact";
  question: string;
  answer: string;
  order: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  coverImageSrc: string;
  coverImageAlt: string;
  author: string;
  authorRole: string;
  category: string;
  tags: string[];
  status: ContentStatus;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
}

export interface GalleryAlbum {
  id: string;
  editionId: string;
  title: string;
  description: string;
  coverSrc: string;
  coverAlt: string;
  aspect: "portrait" | "landscape" | "square";
  photoCount: number;
  driveUrl: string;
}

export interface VolunteerTeam {
  id: string;
  editionId: string;
  name: string;
  slug: string;
  description: string;
  expectation: string;
  capacity: number;
  status: "open" | "closed";
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  emailNormalized?: string | null;
  phone: string;
  phoneNormalized?: string | null;
  occupation: string | null;
  location: string | null;
  preferredChannel: Channel;
  createdAt: string;
}

export interface ContactConsent {
  id: string;
  contactId: string;
  purpose: "event_reminders" | "volunteer_updates" | "enquiry" | "attendance" | "newsletter";
  channel: "whatsapp" | "email";
  status: ConsentStatus;
  source: string;
  policyVersion: string;
  capturedAt: string;
  revokedAt: string | null;
}

export interface Rsvp {
  id: string;
  eventId: string;
  contactId: string;
  response: RsvpResponse;
  source: string;
  preferredChannel: Channel;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  contactId: string;
  checkedInAt: string;
  source: "qr" | "admin";
  occupationSnapshot: string;
  deviceCategory: "mobile" | "tablet" | "desktop";
  duplicateOfId?: string | null;
  duplicateOf?: string | null;
  createdBy?: string | null;
}

export interface VolunteerApplication {
  id: string;
  eventId: string;
  contactId: string;
  teamId: string;
  experience: string;
  availability: string;
  motivation: string;
  occupation?: string;
  location?: string;
  status: VolunteerStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  id: string;
  eventId: string | null;
  name: string;
  category:
    | "rsvp"
    | "reminder"
    | "volunteer"
    | "attendance"
    | "thank_you"
    | "follow_up"
    | "general";
  channel: "email" | "whatsapp";
  subject: string | null;
  previewText: string | null;
  body: string;
  variables: string[];
  version: number;
  status: "draft" | "active" | "archived";
}

export interface Campaign {
  id: string;
  eventId: string;
  name: string;
  type: "broadcast" | "automation" | "test";
  status: CampaignStatus;
  channelMode: CampaignChannelMode;
  audienceLabel: string;
  subject: string | null;
  whatsappBody: string | null;
  emailBody: string | null;
  scheduledAt: string | null;
  eligibleCount: number;
  excludedCount: number;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdBy?: string;
  createdAt: string;
  targetContactIds?: string[];
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  name: string;
  contentType: string;
  dataUrl?: string;
  url?: string;
  size?: number;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  emailNormalized: string;
  name: string | null;
  status: ConsentStatus;
  source: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

export interface Newsletter {
  id: string;
  slug: string;
  title: string;
  subject: string;
  excerpt: string;
  body: string;
  status: NewsletterStatus;
  publishedAt: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  eventId: string;
  name: string;
  triggerType:
    | "rsvp_confirmation"
    | "two_day_reminder"
    | "event_day_reminder"
    | "volunteer_receipt"
    | "volunteer_acceptance"
    | "post_event_thank_you"
    | "email_fallback";
  offsetMinutes: number | null;
  runTime: string | null;
  channelMode: CampaignChannelMode;
  enabled: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: "success" | "partial" | "failed" | "never" | null;
}

export interface WhatsAppSession {
  id: string;
  sessionKey: string;
  displayName: string;
  maskedPhone: string;
  provider: "openwa";
  status: WhatsAppSessionStatus;
  lastSeenAt: string | null;
  lastActivity: string;
  healthNote: string;
  lastErrorCode?: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited" | "disabled";
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadataPreview: string;
  createdAt: string;
}

export interface SitePlaceholders {
  organizationName: string;
  eventSeriesName: string;
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  youtube: string;
  whatsappDisplay: string;
  whatsappNumber: string;
  polo: {
    name: string;
    price: number;
    currency: string;
    colors: Array<{
      name: string;
      slug: string;
      imageSrc: string;
      swatchClass: string;
    }>;
    sizes: string[];
  };
  policyVersion: string;
  social: {
    instagram?: string;
    youtube: string;
    x?: string;
    facebook: string;
    tiktok: string;
  };
}

export interface FieldError {
  field: string;
  message: string;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: MockErrorCode; message: string; errors?: FieldError[] };

export type MockErrorCode =
  | "validation"
  | "duplicate"
  | "existing"
  | "offline"
  | "outside_window"
  | "error";

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export type RsvpSubmitResult =
  | { status: "success"; data: Rsvp }
  | { status: "existing"; data: Rsvp }
  | { status: "validation_error"; errors: FieldError[] }
  | { status: "offline"; message: string }
  | { status: "error"; message: string };
