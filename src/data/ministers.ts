import { CURRENT_EDITION_ID } from "@/data/site";
import type { Minister, ScheduleItem } from "@/types";

export const ministers: Minister[] = [
  {
    id: "min-amara",
    editionId: CURRENT_EDITION_ID,
    name: "Amara Okonkwo",
    role: "Worship lead",
    bio: "Amara leads congregational singing with a clear pastoral instinct. She has served worship teams across Lagos for twelve years and cares most about helping a room actually sing.",
    imageSrc: "/images/minister-amara.jpg",
    imageAlt: "Portrait of Amara Okonkwo",
    featured: true,
    order: 1,
  },
  {
    id: "min-daniel",
    editionId: CURRENT_EDITION_ID,
    name: "Daniel Adeyemi",
    role: "Host pastor",
    bio: "Daniel hosts the day and frames the gathering around Scripture. His work is to keep the room focused on Christ rather than on production.",
    imageSrc: "/images/minister-daniel.jpg",
    imageAlt: "Portrait of Daniel Adeyemi",
    featured: true,
    order: 2,
  },
  {
    id: "min-kwame",
    editionId: CURRENT_EDITION_ID,
    name: "Kwame Mensah",
    role: "Music director",
    bio: "Kwame shapes the musical language of the gathering: keys, voices and dynamics that serve the congregation instead of competing with it.",
    imageSrc: "/images/minister-kwame.jpg",
    imageAlt: "Portrait of Kwame Mensah",
    featured: true,
    order: 3,
  },
  {
    id: "min-chioma",
    editionId: CURRENT_EDITION_ID,
    name: "Chioma Nwosu",
    role: "Prayer and hospitality",
    bio: "Chioma leads the prayer team and the welcome floor. She believes the first ten minutes of a gathering teach people whether they are wanted.",
    imageSrc: "/images/minister-chioma.jpg",
    imageAlt: "Portrait of Chioma Nwosu",
    featured: false,
    order: 4,
  },
  {
    id: "min-tunde",
    editionId: CURRENT_EDITION_ID,
    name: "Tunde Balogun",
    role: "Word",
    bio: "Tunde opens Scripture with patience and weight. His brief for 2026 is a short word on wonder, not a conference keynote.",
    imageSrc: "/images/minister-tunde.jpg",
    imageAlt: "Portrait of Tunde Balogun",
    featured: true,
    order: 5,
  },
];

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
