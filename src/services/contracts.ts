import type {
  AttendanceRecord,
  AutomationRule,
  Campaign,
  Contact,
  EventEdition,
  FieldError,
  MessageTemplate,
  MockErrorCode,
  Newsletter,
  NewsletterSubscriber,
  Rsvp,
  VolunteerApplication,
  VolunteerStatus,
  WhatsAppSession,
} from "@/types";

export interface RsvpInput {
  eventId?: string;
  editionId?: string;
  firstName: string;
  phone: string;
  email?: string;
  preferredChannel: "whatsapp" | "email" | "both";
  consentWhatsApp?: boolean;
  consentEmail?: boolean;
  whatsappConsent?: boolean;
  emailConsent?: boolean;
  source?: string;
}

export interface VolunteerInput {
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  location: string;
  teamId: string;
  experience: string;
  availability: string;
  motivation: string;
  consentWhatsApp: boolean;
  consentEmail: boolean;
}

export interface AttendanceInput {
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  consentAttendance: boolean;
  consentReminders: boolean;
}

export interface EnquiryInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface UnsubscribeInput {
  email?: string;
  phone?: string;
  channel: "email" | "whatsapp" | "both";
}

export interface NewsletterSubscribeInput {
  email: string;
  name?: string;
  source?: string;
}

export type MockSubmitResult<T> =
  | { status: "success"; data: T }
  | { status: "existing"; data: T }
  | { status: "duplicate"; data: T }
  | { status: "validation"; errors: FieldError[] }
  | { status: "validation_error"; errors: FieldError[] }
  | { status: "outside_window"; message: string }
  | { status: "offline"; message: string }
  | { status: "error"; message: string; code?: MockErrorCode };

export interface RsvpService {
  submit(input: RsvpInput): Promise<MockSubmitResult<Rsvp>>;
  decline(eventId: string): Promise<{ recorded: true }>;
  list(eventId: string): Promise<Rsvp[]>;
}

export interface VolunteerService {
  submit(input: VolunteerInput): Promise<MockSubmitResult<VolunteerApplication>>;
  list(eventId: string): Promise<VolunteerApplication[]>;
  updateStatus(
    id: string,
    status: VolunteerStatus,
  ): Promise<MockSubmitResult<VolunteerApplication>>;
}

export interface AttendanceService {
  checkIn(input: AttendanceInput): Promise<MockSubmitResult<AttendanceRecord>>;
  list(eventId: string): Promise<AttendanceRecord[]>;
}

export interface ContactService {
  list(): Promise<Contact[]>;
  enquiry(input: EnquiryInput): Promise<MockSubmitResult<{ id: string }>>;
  unsubscribe(input: UnsubscribeInput): Promise<MockSubmitResult<{ id: string }>>;
}

export interface EditionService {
  list(): Promise<EventEdition[]>;
  getBySlug(slug: string): Promise<EventEdition | undefined>;
  save(edition: EventEdition): Promise<MockSubmitResult<EventEdition>>;
}

export interface CampaignService {
  list(eventId: string): Promise<Campaign[]>;
  templates(): Promise<MessageTemplate[]>;
  automations(eventId: string): Promise<AutomationRule[]>;
  sendTest(campaignId: string): Promise<MockSubmitResult<{ sent: true }>>;
  schedule(campaign: Partial<Campaign>): Promise<MockSubmitResult<Campaign>>;
}

export interface NewsletterService {
  subscribe(input: NewsletterSubscribeInput): Promise<MockSubmitResult<NewsletterSubscriber>>;
  list(): Promise<Newsletter[]>;
}

export interface SessionService {
  get(): Promise<WhatsAppSession>;
}

export interface PublicServices {
  rsvp: RsvpService;
  volunteer: VolunteerService;
  attendance: AttendanceService;
  contacts: ContactService;
  editions: EditionService;
  campaigns: CampaignService;
  newsletters: NewsletterService;
  session: SessionService;
}
