import { rsvps } from "@/data/operations";
import { CURRENT_EDITION_ID } from "@/data/site";
import { isValidEmail, normalizeEmail, normalizeNgPhone } from "@/lib/phone";
import { sleep } from "@/lib/utils";
import type {
  AttendanceService,
  CampaignService,
  ContactService,
  EditionService,
  MockSubmitResult,
  PublicServices,
  RsvpInput,
  RsvpService,
  SessionService,
  VolunteerInput,
  VolunteerService,
} from "@/services/contracts";
import { attendance, campaigns, contacts, templates, automations, volunteerApplications, whatsappSession } from "@/data/operations";
import { editions } from "@/data/editions";
import type { AttendanceInput, EnquiryInput, UnsubscribeInput } from "@/services/contracts";
import type { AttendanceRecord, Rsvp, VolunteerApplication } from "@/types";

const LATENCY = 700;

function maybeForcedStatus() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("mockState");
}

function isOffline() {
  if (maybeForcedStatus() === "offline") return true;
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

const rsvpStore: Rsvp[] = [...rsvps];
const volunteerStore: VolunteerApplication[] = [...volunteerApplications];
const attendanceStore: AttendanceRecord[] = [...attendance];

export const rsvpService: RsvpService = {
  async submit(input: RsvpInput) {
    await sleep(LATENCY);
    const forced = maybeForcedStatus();
    if (forced === "error") {
      return { status: "error", message: "The reminder service is unavailable. Try again." };
    }
    if (isOffline() || forced === "offline") {
      return { status: "offline", message: "You appear to be offline. Your details were kept on this device." };
    }

    const errors = validateRsvp(input);
    if (errors.length) return { status: "validation_error", errors };

    const eventId = input.eventId ?? input.editionId ?? CURRENT_EDITION_ID;
    const existing = rsvpStore.find((item) => item.eventId === eventId);
    if (existing || forced === "existing") {
      const record = existing ?? rsvpStore[0];
      return { status: "existing", data: record };
    }

    const created: Rsvp = {
      id: `r-${Date.now()}`,
      eventId,
      contactId: `c-${Date.now()}`,
      response: "attending",
      source: input.source ?? "modal",
      preferredChannel: input.preferredChannel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rsvpStore.unshift(created);
    return { status: "success", data: created };
  },
  async decline() {
    await sleep(400);
    return { recorded: true };
  },
  async list(eventId) {
    await sleep(300);
    return rsvpStore.filter((item) => item.eventId === eventId);
  },
};

export const volunteerService: VolunteerService = {
  async submit(input: VolunteerInput) {
    await sleep(LATENCY);
    if (isOffline()) {
      return { status: "offline", message: "You appear to be offline. Review your answers and try again." };
    }
    const errors = validateVolunteer(input);
    if (errors.length) return { status: "validation", errors };
    const created: VolunteerApplication = {
      id: `v-${Date.now()}`,
      eventId: input.eventId,
      contactId: `c-${Date.now()}`,
      teamId: input.teamId,
      experience: input.experience,
      availability: input.availability,
      motivation: input.motivation,
      occupation: input.occupation,
      location: input.location,
      status: "submitted",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    volunteerStore.unshift(created);
    return { status: "success", data: created };
  },
  async list(eventId) {
    await sleep(250);
    return volunteerStore.filter((item) => item.eventId === eventId);
  },
  async updateStatus(id, status) {
    await sleep(500);
    const found = volunteerStore.find((item) => item.id === id);
    if (!found) return { status: "error", message: "Application not found." };
    found.status = status;
    found.updatedAt = new Date().toISOString();
    found.reviewedAt = new Date().toISOString();
    found.reviewedBy = "u-nkechi";
    return { status: "success", data: found };
  },
};

export const attendanceService: AttendanceService & {
  submit: AttendanceService["checkIn"];
} = {
  async checkIn(input: AttendanceInput) {
    await sleep(800);
    const forced = maybeForcedStatus();
    if (forced === "failure" || forced === "error") {
      return { status: "error", message: "Check-in could not be confirmed. Please retry." };
    }
    if (forced === "offline" || forced === "offline_pending" || isOffline()) {
      return { status: "offline", message: "Saved on this phone. We will retry when the network returns." };
    }
    if (forced === "outside_window" || forced === "outside_event_window") {
      return {
        status: "outside_window",
        message: "Check-in is only open during the event window. Staff can record attendance from admin if needed.",
      };
    }
    const errors = validateAttendance(input);
    if (errors.length) return { status: "validation", errors };

    const phone = normalizeNgPhone(input.phone);
    const email = normalizeEmail(input.email);
    const duplicate = attendanceStore.find(
      (item) => item.eventId === input.eventId && item.occupationSnapshot === input.occupation,
    );
    if (forced !== "success" && (forced === "duplicate" || (duplicate && phone))) {
      return {
        status: "duplicate",
        data: duplicate ?? attendanceStore[0],
      };
    }

    const created: AttendanceRecord = {
      id: `a-${Date.now()}`,
      eventId: input.eventId,
      contactId: `c-${Date.now()}`,
      checkedInAt: new Date().toISOString(),
      source: "qr",
      occupationSnapshot: input.occupation,
      deviceCategory: "mobile",
      duplicateOfId: null,
    };
    attendanceStore.unshift(created);
    void email;
    return { status: "success", data: created };
  },
  async submit(input: AttendanceInput) {
    return attendanceService.checkIn(input);
  },
  async list(eventId) {
    await sleep(250);
    return attendanceStore.filter((item) => item.eventId === eventId);
  },
};

export const contactService: ContactService = {
  async list() {
    await sleep(250);
    return contacts;
  },
  async enquiry(input: EnquiryInput) {
    await sleep(LATENCY);
    const errors = [];
    if (!input.name.trim()) errors.push({ field: "name", message: "Enter your name." });
    if (!isValidEmail(input.email)) errors.push({ field: "email", message: "Enter a valid email address." });
    if (input.message.trim().length < 12) errors.push({ field: "message", message: "Please write a little more so we can help." });
    if (errors.length) return { status: "validation", errors };
    if (isOffline()) return { status: "offline", message: "You appear to be offline." };
    return { status: "success", data: { id: `enq-${Date.now()}` } };
  },
  async unsubscribe(input: UnsubscribeInput) {
    await sleep(500);
    if (!input.email && !input.phone) {
      return {
        status: "validation",
        errors: [{ field: "email", message: "Provide an email address or WhatsApp number." }],
      };
    }
    return { status: "success", data: { id: `unsub-${Date.now()}` } };
  },
};

export const enquiryService = {
  submit: (input: EnquiryInput) => contactService.enquiry(input),
};

export const unsubscribeService = {
  submit: (input: UnsubscribeInput) => contactService.unsubscribe(input),
};

export const editionService: EditionService = {
  async list() {
    await sleep(200);
    return editions;
  },
  async getBySlug(slug) {
    await sleep(120);
    return editions.find((edition) => edition.slug === slug);
  },
  async save(edition) {
    await sleep(500);
    return { status: "success", data: edition };
  },
};

export const campaignService: CampaignService = {
  async list(eventId: string) {
    await sleep(200);
    return campaigns.filter((row) => row.eventId === eventId);
  },
  async templates() {
    await sleep(200);
    return templates;
  },
  async automations(eventId: string) {
    await sleep(200);
    return automations.filter((row) => row.eventId === eventId);
  },
  async sendTest(_campaignId: string) {
    await sleep(600);
    void _campaignId;
    if (isOffline()) return { status: "offline", message: "Offline. Test not sent." };
    return { status: "success", data: { sent: true } };
  },
  async schedule(campaign) {
    await sleep(700);
    return {
      status: "success",
      data: {
        id: `camp-${Date.now()}`,
        eventId: campaign.eventId ?? CURRENT_EDITION_ID,
        name: campaign.name ?? "Untitled campaign",
        type: "broadcast",
        status: "scheduled",
        channelMode: campaign.channelMode ?? "both",
        audienceLabel: campaign.audienceLabel ?? "Selected segment",
        subject: campaign.subject ?? null,
        whatsappBody: campaign.whatsappBody ?? "",
        emailBody: campaign.emailBody ?? "",
        scheduledAt: campaign.scheduledAt ?? new Date().toISOString(),
        eligibleCount: campaign.eligibleCount ?? 0,
        excludedCount: campaign.excludedCount ?? 0,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
      },
    };
  },
};

export const sessionService: SessionService = {
  async get() {
    await sleep(150);
    return whatsappSession;
  },
};

export const services: PublicServices = {
  rsvp: rsvpService,
  volunteer: volunteerService,
  attendance: attendanceService,
  contacts: contactService,
  editions: editionService,
  campaigns: campaignService,
  session: sessionService,
};

function validateRsvp(input: RsvpInput) {
  const errors: { field: string; message: string }[] = [];
  if (input.firstName.trim().length < 2) {
    errors.push({ field: "firstName", message: "Enter your first name." });
  }
  if (!normalizeNgPhone(input.phone)) {
    errors.push({ field: "phone", message: "Enter a valid Nigerian WhatsApp number." });
  }
  if (input.email && !isValidEmail(input.email)) {
    errors.push({ field: "email", message: "Enter a valid email or leave this blank." });
  }
  if (input.preferredChannel === "email" && !input.email) {
    errors.push({ field: "email", message: "Email is required when email reminders are selected." });
  }
  const whatsappConsent = input.whatsappConsent ?? input.consentWhatsApp;
  const emailConsent = input.emailConsent ?? input.consentEmail;
  if ((input.preferredChannel === "whatsapp" || input.preferredChannel === "both") && !whatsappConsent) {
    errors.push({ field: "whatsappConsent", message: "Confirm WhatsApp reminders to continue." });
  }
  if ((input.preferredChannel === "email" || input.preferredChannel === "both") && !emailConsent) {
    errors.push({ field: "emailConsent", message: "Confirm email reminders to continue." });
  }
  if (input.preferredChannel === "email" && !input.email) {
    errors.push({ field: "preferredChannel", message: "Choose WhatsApp, or add an email address." });
  }
  return errors;
}

function validateVolunteer(input: VolunteerInput) {
  const errors: { field: string; message: string }[] = [];
  if (input.fullName.trim().length < 3) errors.push({ field: "fullName", message: "Enter your full name." });
  if (!isValidEmail(input.email)) errors.push({ field: "email", message: "Enter a valid email address." });
  if (!normalizeNgPhone(input.phone)) errors.push({ field: "phone", message: "Enter a valid WhatsApp number." });
  if (!input.occupation.trim()) errors.push({ field: "occupation", message: "Tell us your occupation." });
  if (!input.location.trim()) errors.push({ field: "location", message: "Tell us your location." });
  if (!input.teamId) errors.push({ field: "teamId", message: "Choose a team." });
  if (input.experience.trim().length < 8) errors.push({ field: "experience", message: "Share a little relevant experience." });
  if (input.availability.trim().length < 4) errors.push({ field: "availability", message: "Tell us when you can serve." });
  if (input.motivation.trim().length < 12) errors.push({ field: "motivation", message: "Tell us why you want to serve." });
  if (!input.consentWhatsApp || !input.consentEmail) {
    errors.push({ field: "consent", message: "Application updates are sent on WhatsApp and email. Both consents are required." });
  }
  return errors;
}

function validateAttendance(input: AttendanceInput) {
  const errors: { field: string; message: string }[] = [];
  if (input.fullName.trim().length < 3) errors.push({ field: "fullName", message: "Enter your full name." });
  if (!isValidEmail(input.email)) errors.push({ field: "email", message: "Enter a valid email address." });
  if (!normalizeNgPhone(input.phone)) errors.push({ field: "phone", message: "Enter a valid WhatsApp number." });
  if (!input.occupation.trim()) errors.push({ field: "occupation", message: "Enter your occupation." });
  if (!input.consentAttendance) errors.push({ field: "consentAttendance", message: "Confirm attendance recording to continue." });
  return errors;
}

export type { MockSubmitResult };
