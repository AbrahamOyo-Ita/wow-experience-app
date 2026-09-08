import { CURRENT_EDITION_ID } from "@/data/site";
import type { EventEdition } from "@/types";

export { SITE, CURRENT_EDITION_ID, CURRENT_EDITION_YEAR } from "@/data/site";

export const editions: EventEdition[] = [
  {
    id: CURRENT_EDITION_ID,
    year: 2026,
    name: "Wonders of Worship Experience 2026",
    shortName: "WOW 2026",
    slug: "2026",
    theme: "A people in wonder",
    statement: "One gathering. One people. One sound of worship.",
    description:
      "Wonders of Worship Experience 2026 is a focused gathering for people who want to worship Christ with clarity, reverence and joy. The day is built around Scripture, congregational singing and a quiet invitation to serve.",
    timezone: "Africa/Lagos",
    startsAt: "2026-10-18T09:00:00+01:00",
    endsAt: "2026-10-18T14:00:00+01:00",
    doorsAt: "2026-10-18T08:00:00+01:00",
    venue: {
      name: "Sanctified Mount Zion Church",
      address: "#25 Ibiono Street, Uyo, Akwa Ibom State",
      city: "Uyo",
      country: "Nigeria",
      directionsUrl:
        "https://maps.google.com/?q=Sanctified+Mount+Zion+Church+25+Ibiono+Street+Uyo+Akwa+Ibom+State",
      notes: "Final venue details will be sent to everyone who RSVPs.",
    },
    status: "published",
    publishedAt: "2026-06-01T10:00:00+01:00",
    galleryDriveUrl: "https://drive.google.com",
    attendanceUrl: "/attend/2026",
    attendanceWindowStartsAt: "2026-10-18T07:00:00+01:00",
    attendanceWindowEndsAt: "2026-10-18T16:00:00+01:00",
    reminderTwoDayEnabled: true,
    reminderEventDayEnabled: true,
    reminderEventDayTime: "07:00",
    qrTargetUrl: "/attend/2026",
    isDatePlaceholder: false,
    isVenuePlaceholder: false,
  },
  {
    id: "edition-2025",
    year: 2025,
    name: "Wonders of Worship Experience 2025",
    shortName: "WOW 2025",
    slug: "2025",
    theme: "Behold Him",
    statement: "A first gathering around the worth of Christ.",
    description:
      "The 2025 edition introduced the annual rhythm: a simple room, a prepared people, and a day given to worship.",
    timezone: "Africa/Lagos",
    startsAt: "2025-11-08T09:00:00+01:00",
    endsAt: "2025-11-08T13:30:00+01:00",
    doorsAt: "2025-11-08T08:00:00+01:00",
    venue: {
      name: "The Hall, Ikeja",
      address: "Ikeja, Lagos",
      city: "Lagos",
      country: "Nigeria",
      directionsUrl: "https://maps.google.com/?q=Ikeja+Lagos",
      notes: "Completed edition.",
    },
    status: "completed",
    publishedAt: "2025-07-01T10:00:00+01:00",
    galleryDriveUrl: "https://drive.google.com",
    attendanceUrl: "/attend/2025",
    attendanceWindowStartsAt: "2025-11-08T07:00:00+01:00",
    attendanceWindowEndsAt: "2025-11-08T16:00:00+01:00",
    reminderTwoDayEnabled: true,
    reminderEventDayEnabled: true,
    reminderEventDayTime: "07:00",
    qrTargetUrl: "/attend/2025",
    isDatePlaceholder: false,
    isVenuePlaceholder: false,
  },
  {
    id: "edition-2027",
    year: 2027,
    name: "Wonders of Worship Experience 2027",
    shortName: "WOW 2027",
    slug: "2027",
    theme: "To be announced",
    statement: "The next annual gathering will open after 2026.",
    description:
      "2027 will reuse this same platform. Dates, ministers and venue will be published after the 2026 edition.",
    timezone: "Africa/Lagos",
    startsAt: "2027-11-13T09:00:00+01:00",
    endsAt: "2027-11-13T14:00:00+01:00",
    doorsAt: "2027-11-13T08:00:00+01:00",
    venue: {
      name: "To be announced",
      address: "To be announced",
      city: "Lagos",
      country: "Nigeria",
      directionsUrl: "https://maps.google.com/?q=Lagos",
      notes: "Draft edition for platform reuse.",
    },
    status: "draft",
    publishedAt: null,
    galleryDriveUrl: "https://drive.google.com",
    attendanceUrl: "/attend/2027",
    attendanceWindowStartsAt: "2027-11-13T07:00:00+01:00",
    attendanceWindowEndsAt: "2027-11-13T16:00:00+01:00",
    reminderTwoDayEnabled: true,
    reminderEventDayEnabled: true,
    reminderEventDayTime: "07:00",
    qrTargetUrl: "/attend/2027",
    isDatePlaceholder: true,
    isVenuePlaceholder: true,
  },
];

export function getEditionByYear(year: number) {
  return editions.find((edition) => edition.year === year);
}

export function getEditionBySlug(slug: string) {
  return editions.find((edition) => edition.slug === slug);
}

export function getCurrentEdition() {
  return editions.find((edition) => edition.id === CURRENT_EDITION_ID)!;
}

export function getPublishedEditions() {
  return editions.filter(
    (edition) =>
      edition.status === "published" ||
      edition.status === "live" ||
      edition.status === "completed" ||
      edition.status === "archived",
  );
}
