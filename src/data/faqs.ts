import { CURRENT_EDITION_ID } from "@/data/site";
import type { FaqItem } from "@/types";

export const faqs: FaqItem[] = [
  {
    id: "faq-venue",
    editionId: CURRENT_EDITION_ID,
    category: "venue",
    question: "Where is Wonders of Worship Experience 2026 holding?",
    answer:
      "Wonders of Worship Experience 2026 is holding at Sanctified Mount Zion Church, #25 Ibiono Street, Uyo, Akwa Ibom State, Nigeria. Reminder messages will carry the address and directions link.",
    order: 1,
  },
  {
    id: "faq-time",
    editionId: CURRENT_EDITION_ID,
    category: "time",
    question: "What time should I arrive?",
    answer:
      "Doors are planned for 8:00 AM West Africa Time. The gathering begins at 9:00 AM. Arrive early if you want a seat near the front or if you are serving on a volunteer team.",
    order: 2,
  },
  {
    id: "faq-entry",
    editionId: CURRENT_EDITION_ID,
    category: "entry",
    question: "Is there a ticket or registration fee?",
    answer:
      "No. RSVP is free and records your intention to attend. On the day, scan the venue QR code to check in. RSVP is not the same as attendance.",
    order: 3,
  },
  {
    id: "faq-bring",
    editionId: CURRENT_EDITION_ID,
    category: "what_to_bring",
    question: "What should I bring?",
    answer:
      "Bring a Bible if you use one, water, and a heart ready to sing. Photography for personal memory is welcome during permitted moments. Full event photography will be shared in the gallery after the day.",
    order: 4,
  },
  {
    id: "faq-children",
    editionId: CURRENT_EDITION_ID,
    category: "children",
    question: "Can I come with children?",
    answer:
      "Families are welcome. There is no separate children's programme in this edition, so parents remain responsible for their children throughout the gathering. If that plan changes, we will say so clearly before the event.",
    order: 5,
  },
  {
    id: "faq-access",
    editionId: CURRENT_EDITION_ID,
    category: "accessibility",
    question: "How accessible is the venue?",
    answer:
      "We will publish step-free access, seating support and contact details with the final venue note. If you need a specific arrangement, write to us through the contact page before the week of the event.",
    order: 6,
  },
  {
    id: "faq-parking",
    editionId: CURRENT_EDITION_ID,
    category: "parking",
    question: "Is there parking?",
    answer:
      "Parking guidance will be included with the venue announcement. We recommend ride-sharing where possible. Volunteers on the welcome team will help with arrival flow.",
    order: 7,
  },
  {
    id: "faq-contact",
    editionId: CURRENT_EDITION_ID,
    category: "contact",
    question: "How do I ask a question that is not listed here?",
    answer:
      "Use the contact page. For event reminders, RSVP first so we can reach you on WhatsApp or email with your consent.",
    order: 8,
  },
];

export function getFaqsByEdition(editionId: string) {
  return faqs
    .filter((item) => item.editionId === editionId || item.editionId === null)
    .sort((a, b) => a.order - b.order);
}

export const volunteerFaqs = [
  {
    id: "vf-who",
    question: "Who should apply?",
    answer:
      "People who can keep a clear commitment for the event day, attend any briefing we send, and serve without needing the platform. If this season is full for you, come as a guest.",
  },
  {
    id: "vf-when",
    question: "When will I hear back?",
    answer:
      "Team leads review applications in order. You will hear on WhatsApp and email. Accepted volunteers receive a working group link only after that review. We never add you to a public list.",
  },
  {
    id: "vf-time",
    question: "How early do volunteers arrive?",
    answer:
      "It depends on the team. Logistics starts around 6:30 AM. Hospitality is in place by 7:15 AM. Worship team members attend the midweek rehearsal and arrive 75 minutes before doors.",
  },
  {
    id: "vf-status",
    question: "What do the status labels mean?",
    answer:
      "Submitted means we have your form. Under review means a lead is reading it. Accepted, waitlisted or declined is the decision. You can still worship with us if we cannot place you on a team.",
  },
];
