import { CURRENT_EDITION_ID } from "@/data/site";
import type { GalleryAlbum, VolunteerTeam } from "@/types";

export const volunteerTeams: VolunteerTeam[] = [
  {
    id: "team-hospitality",
    editionId: CURRENT_EDITION_ID,
    name: "Hospitality & Welcome",
    slug: "hospitality",
    description: "Welcome guests at the doors, assist seating, and maintain a warm, orderly arrival.",
    expectation: "Arrive by 7:15 AM on gathering day. Remain present until guests depart smoothly.",
    capacity: 24,
    status: "open",
  },
  {
    id: "team-worship",
    editionId: CURRENT_EDITION_ID,
    name: "Worship & Choir",
    slug: "worship-team",
    description: "Vocalists and instrumentalists dedicated to supporting congregational singing.",
    expectation: "Attend scheduled rehearsals and be ready in position 75 minutes prior to doors open.",
    capacity: 16,
    status: "open",
  },
  {
    id: "team-media",
    editionId: CURRENT_EDITION_ID,
    name: "Media & Visuals",
    slug: "media",
    description: "Manage lyric screens, room lighting, and capture reverent photography.",
    expectation: "Arrive for early sound check. Maintain quiet reverence during prayer and ministry.",
    capacity: 8,
    status: "open",
  },
  {
    id: "team-prayer",
    editionId: CURRENT_EDITION_ID,
    name: "Prayer & Intercession",
    slug: "prayer",
    description: "Stand in prayer before the gathering and facilitate ministry after the message.",
    expectation: "Join the 7:30 AM intercession session and remain available through event close.",
    capacity: 12,
    status: "open",
  },
  {
    id: "team-logistics",
    editionId: CURRENT_EDITION_ID,
    name: "Logistics & Venue Setup",
    slug: "logistics",
    description: "Hall layout, signage, water stations, and technical support that allows the gathering to flow smoothly.",
    expectation: "Setup begins at 6:30 AM. Assist with hall wrap-up following the gathering.",
    capacity: 18,
    status: "open",
  },
];

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "gal-2026-rehearsal",
    editionId: CURRENT_EDITION_ID,
    title: "2026 Rehearsals & Preparation",
    description: "Behind the scenes as ministers and teams prepare for the Uyo gathering.",
    coverSrc: "/images/experience-stage.jpg",
    coverAlt: "Stage lights during worship preparation",
    aspect: "landscape",
    photoCount: 18,
    driveUrl: "https://drive.google.com",
  },
  {
    id: "gal-2025-gathering",
    editionId: "edition-2025",
    title: "The 2025 Inaugural Gathering",
    description: "Highlights from our maiden gathering in Ikeja, Lagos.",
    coverSrc: "/images/gallery-gathering.jpg",
    coverAlt: "Congregation gathered in 2025",
    aspect: "landscape",
    photoCount: 42,
    driveUrl: "https://drive.google.com",
  },
  {
    id: "gal-2025-serve",
    editionId: "edition-2025",
    title: "2025 Volunteer Teams",
    description: "Honoring the hospitality, media, and prayer teams who served in 2025.",
    coverSrc: "/images/volunteer-serve.jpg",
    coverAlt: "Volunteers serving at the hall",
    aspect: "square",
    photoCount: 16,
    driveUrl: "https://drive.google.com",
  },
  {
    id: "gal-2026-portraits",
    editionId: CURRENT_EDITION_ID,
    title: "Minister Portraits",
    description: "Portraits of the worship ministers leading the 2026 edition.",
    coverSrc: "/images/minister-amara.jpg",
    coverAlt: "Amara Okonkwo portrait",
    aspect: "portrait",
    photoCount: 8,
    driveUrl: "https://drive.google.com",
  },
];

export function getTeamsByEdition(editionId: string) {
  return volunteerTeams.filter((team) => team.editionId === editionId);
}

export function getAlbumsByEdition(editionId: string | "all") {
  if (editionId === "all") return galleryAlbums;
  return galleryAlbums.filter((album) => album.editionId === editionId);
}

export const values = [
  {
    title: "Christ at the Center",
    body: "Our platform and gatherings exist solely to behold Jesus. Music, design, and media are dedicated servants of worship, never the spectacle.",
  },
  {
    title: "Authentic Congregational Singing",
    body: "We prioritize songs the whole room can sing together over complex platform performances. Every voice matters.",
  },
  {
    title: "Warm & Prepared Hospitality",
    body: "Welcoming people with genuine care sets the tone for worship. Every attendee is treated as a honored guest of Christ.",
  },
  {
    title: "Honesty & Respect with Data",
    body: "An RSVP is a relationship of trust. We request only essential details, strictly honor notification preferences, and protect your privacy.",
  },
];

export const organizingTeam = [
  {
    name: "Ruth Eze",
    role: "Gathering Direction",
    bio: "Ruth stewards the spiritual vision and editorial direction of Wonders of Worship, holding the room's unhurried focus since our maiden edition.",
    imageSrc: "/images/minister-chioma.jpg",
    imageAlt: "Portrait of Ruth Eze",
  },
  {
    name: "Kemi Ajayi",
    role: "Operations & Logistics",
    bio: "Kemi coordinates volunteer teams, venue operations, and guest experience, ensuring gathering days run with calm efficiency.",
    imageSrc: "/images/minister-amara.jpg",
    imageAlt: "Portrait of Kemi Ajayi",
  },
  {
    name: "Ibrahim Sule",
    role: "Communications & Digital Platform",
    bio: "Ibrahim manages community updates, platform copy, and digital communications that welcome guests with clarity.",
    imageSrc: "/images/minister-daniel.jpg",
    imageAlt: "Portrait of Ibrahim Sule",
  },
];

export const previousImpact = {
  year: 2025,
  theme: "Behold Him",
  summary:
    "Our inaugural 2025 gathering in Ikeja established our foundational pattern: one room, a focused message, and hours dedicated to congregational worship.",
  notes: [
    "Single-day focused worship gathering built around deep reverence.",
    "Dedicated volunteer teams covering hospitality, intercession, media, and venue flow.",
    "A lasting record preserved in gallery archives for the community.",
  ],
};
