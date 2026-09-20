import { CURRENT_EDITION_ID } from "@/data/site";
import type { Minister, ScheduleItem } from "@/types";

export const ministers: Minister[] = [];

export const schedule: ScheduleItem[] = [
  {
    id: "sch-doors",
    editionId: CURRENT_EDITION_ID,
    startsAt: "2026-10-18T08:00:00+01:00",
    endsAt: "2026-10-18T09:00:00+01:00",
    title: "Doors and welcome",
    description: "Arrival, seating and a quiet room before the first song.",
  },
  {
    id: "sch-open",
    editionId: CURRENT_EDITION_ID,
    startsAt: "2026-10-18T09:00:00+01:00",
    endsAt: "2026-10-18T09:20:00+01:00",
    title: "Opening and Scripture",
    description: "A short welcome and a reading that sets the tone for the day.",
  },
  {
    id: "sch-worship",
    editionId: CURRENT_EDITION_ID,
    startsAt: "2026-10-18T09:20:00+01:00",
    endsAt: "2026-10-18T11:10:00+01:00",
    title: "Congregational worship",
    description: "Extended singing led for the room, not for the platform.",
  },
  {
    id: "sch-word",
    editionId: CURRENT_EDITION_ID,
    startsAt: "2026-10-18T11:10:00+01:00",
    endsAt: "2026-10-18T11:50:00+01:00",
    title: "The word",
    description: "A focused teaching on wonder, worship and the person of Christ.",
  },
  {
    id: "sch-close",
    editionId: CURRENT_EDITION_ID,
    startsAt: "2026-10-18T11:50:00+01:00",
    endsAt: "2026-10-18T14:00:00+01:00",
    title: "Response, prayer and close",
    description: "Space to pray, serve and leave without rush.",
  },
];

export function getMinistersByEdition(editionId: string) {
  return ministers
    .filter((minister) => minister.editionId === editionId)
    .sort((a, b) => a.order - b.order);
}

export function getFeaturedMinisters(editionId: string) {
  return getMinistersByEdition(editionId).filter((minister) => minister.featured);
}

export function getScheduleByEdition(editionId: string) {
  return schedule.filter((item) => item.editionId === editionId);
}

export const schedule2026 = schedule.filter(
  (item) => item.editionId === CURRENT_EDITION_ID,
);
