import {
  adminCheckIn,
  loadAdminBundle,
  saveEditionAction,
  scheduleCampaignAction,
  toggleAutomationAction,
  updateVolunteerStatusAction,
} from "@/actions/admin";
import {
  checkInAttendance,
  declineRsvp,
  listPublishedNewsletters,
  subscribeNewsletter,
  submitEnquiry,
  submitRsvp,
  submitVolunteer,
  unsubscribeContact,
} from "@/actions/public";
import type {
  AttendanceService,
  CampaignService,
  ContactService,
  EditionService,
  NewsletterService,
  PublicServices,
  RsvpService,
  SessionService,
  VolunteerService,
} from "@/services/contracts";
import { editions } from "@/data/editions";
import type { VolunteerStatus } from "@/types";

export const rsvpService: RsvpService = {
  submit: submitRsvp,
  decline: async (eventId: string) => declineRsvp(eventId),
  async list(eventId: string) {
    const bundle = await loadAdminBundle();
    return bundle.rsvps.filter((row) => row.eventId === eventId);
  },
};

export const volunteerService: VolunteerService = {
  submit: submitVolunteer,
  async list(eventId: string) {
    const bundle = await loadAdminBundle();
    return bundle.volunteers.filter((row) => row.eventId === eventId);
  },
  updateStatus: (id: string, status: VolunteerStatus) => updateVolunteerStatusAction(id, status),
};

export const attendanceService: AttendanceService & { submit: AttendanceService["checkIn"] } = {
  checkIn: checkInAttendance,
  submit: checkInAttendance,
  async list(eventId: string) {
    const bundle = await loadAdminBundle();
    return bundle.attendance.filter((row) => row.eventId === eventId);
  },
};

export const contactService: ContactService = {
  async list() {
    const bundle = await loadAdminBundle();
    return bundle.contacts;
  },
  enquiry: submitEnquiry,
  unsubscribe: unsubscribeContact,
};

export const enquiryService = {
  submit: submitEnquiry,
};

export const unsubscribeService = {
  submit: unsubscribeContact,
};

export const editionService: EditionService = {
  async list() {
    const bundle = await loadAdminBundle();
    return bundle.editions.length ? bundle.editions : editions;
  },
  async getBySlug(slug: string) {
    const list = await editionService.list();
    return list.find((edition) => edition.slug === slug);
  },
  save: saveEditionAction,
};

export const campaignService: CampaignService = {
  async list(eventId: string) {
    const bundle = await loadAdminBundle();
    return bundle.campaigns.filter((row) => row.eventId === eventId);
  },
  async templates() {
    const bundle = await loadAdminBundle();
    return bundle.templates;
  },
  async automations(eventId: string) {
    const bundle = await loadAdminBundle();
    return bundle.automations.filter((row) => row.eventId === eventId);
  },
  async sendTest() {
    return {
      status: "error",
      message: "Test sends require RESEND_API_KEY or an OpenWA host. The campaign was not sent.",
    };
  },
  schedule: scheduleCampaignAction,
};

export const newsletterService: NewsletterService = {
  subscribe: subscribeNewsletter,
  list: listPublishedNewsletters,
};

export const sessionService: SessionService = {
  async get() {
    const bundle = await loadAdminBundle();
    if (bundle.whatsappSession) return bundle.whatsappSession;
    return {
      id: "wow-primary",
      sessionKey: "wow-primary",
      displayName: "WOW Experience reminders",
      maskedPhone: "",
      provider: "openwa",
      status: "disconnected",
      lastSeenAt: null,
      lastActivity: "No session row yet.",
      healthNote: "Apply the database migration, then connect OpenWA.",
    };
  },
};

export { adminCheckIn, toggleAutomationAction };

export const services: PublicServices = {
  rsvp: rsvpService,
  volunteer: volunteerService,
  attendance: attendanceService,
  contacts: contactService,
  editions: editionService,
  campaigns: campaignService,
  newsletters: newsletterService,
  session: sessionService,
};
