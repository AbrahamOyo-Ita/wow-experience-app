import type { EventEdition } from "@/types";
import { formatEventDate, formatEventTime } from "@/lib/utils";

export function buildIcs(edition: EventEdition) {
  const stamp = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wonders of Worship Experience//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${edition.id}@wowexperience.com.ng`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(edition.startsAt)}`,
    `DTEND:${stamp(edition.endsAt)}`,
    `SUMMARY:${edition.name}`,
    `DESCRIPTION:${edition.theme}. ${edition.venue.notes}`,
    `LOCATION:${edition.venue.name}, ${edition.venue.city}, ${edition.venue.country}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return ics;
}

export function downloadIcs(edition: EventEdition) {
  const blob = new Blob([buildIcs(edition)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${edition.slug}-wonders-of-worship.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(edition: EventEdition) {
  const dates = `${edition.startsAt.replace(/[-:]/g, "").replace(".000", "")}/${edition.endsAt.replace(/[-:]/g, "").replace(".000", "")}`;
  const compact = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: edition.name,
    dates: `${compact(edition.startsAt)}/${compact(edition.endsAt)}`,
    details: `${edition.theme}\n${formatEventDate(edition.startsAt, edition.timezone)} ${formatEventTime(edition.startsAt, edition.timezone)}`,
    location: `${edition.venue.name}, ${edition.venue.city}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}&dates=${dates}`;
}
