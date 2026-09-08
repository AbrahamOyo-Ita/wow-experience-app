import { CURRENT_EDITION_ID } from "@/data/site";
import type { GalleryAlbum, VolunteerTeam } from "@/types";

export const volunteerTeams: VolunteerTeam[] = [
  {
    id: "team-hospitality",
    editionId: CURRENT_EDITION_ID,
    name: "Hospitality",
    slug: "hospitality",
    description: "Meet people at the door, seat the room and keep arrival calm.",
    expectation: "Arrive by 7:15 AM. Remain until the last guest is pointed toward exit flow.",
    capacity: 24,
    status: "open",
  },
  {
    id: "team-worship",
    editionId: CURRENT_EDITION_ID,
    name: "Worship team",
    slug: "worship-team",
    description: "Voices and instruments that serve congregational singing.",
    expectation: "Attend the midweek rehearsal and be in place 75 minutes before doors.",
    capacity: 16,
    status: "open",
  },
  {
    id: "team-media",
    editionId: CURRENT_EDITION_ID,
    name: "Media",
    slug: "media",
    description: "Lyrics, lighting cues and a restrained photographic record.",
    expectation: "Arrive for sound check. No photography during prayer unless briefed.",
    capacity: 8,
    status: "open",
  },
  {
    id: "team-prayer",
    editionId: CURRENT_EDITION_ID,
    name: "Prayer",
    slug: "prayer",
    description: "Intercede before the gathering and be available for ministry after the word.",
    expectation: "Join the 7:30 AM prayer set. Stay through close.",
    capacity: 12,
    status: "open",
  },
  {
    id: "team-logistics",
    editionId: CURRENT_EDITION_ID,
    name: "Logistics",
    slug: "logistics",
    description: "Chairs, water, signage and the unglamorous work that lets the room breathe.",
    expectation: "Setup from 6:30 AM. Strike after the gathering.",
    capacity: 18,
    status: "open",
  },
];

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "gal-2026-rehearsal",
    editionId: CURRENT_EDITION_ID,
    title: "Rehearsal rooms",
    description: "Quiet preparation before the 2026 gathering.",
    coverSrc: "/images/experience-stage.jpg",
    coverAlt: "Stage lights during rehearsal",
    aspect: "landscape",
    photoCount: 18,
    driveUrl: "https://drive.google.com",
  },
  {
    id: "gal-2025-gathering",
    editionId: "edition-2025",
    title: "The 2025 gathering",
    description: "Still frames from the first annual edition.",
    coverSrc: "/images/gallery-gathering.jpg",
    coverAlt: "Congregation gathered in 2025",
    aspect: "landscape",
    photoCount: 42,
    driveUrl: "https://drive.google.com",
  },
  {
    id: "gal-2025-serve",
    editionId: "edition-2025",
    title: "People who served",
    description: "Hospitality, media and prayer teams from 2025.",
    coverSrc: "/images/volunteer-serve.jpg",
    coverAlt: "Volunteers preparing the hall",
    aspect: "square",
    photoCount: 16,
    driveUrl: "https://drive.google.com",
  },
  {
    id: "gal-2026-portraits",
    editionId: CURRENT_EDITION_ID,
    title: "Minister portraits",
    description: "Editorial portraits for the 2026 edition.",
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
    title: "Christ before the room",
    body: "The gathering exists so people can look at Jesus. Lights, songs and a website are servants of that, not the point.",
  },
  {
    title: "A congregation that sings",
    body: "We plan for voices in the room, not a performance on a platform. If the people cannot sing it, we do not programme it.",
  },
  {
    title: "A prepared welcome",
    body: "The first ten minutes teach people whether they are wanted. Hospitality is ministry, not a production cue.",
  },
  {
    title: "Care with names and numbers",
    body: "An RSVP is a trust. We ask only what we need, record consent per channel, and never publish an attendee list.",
  },
];

export const organizingTeam = [
  {
    name: "Ruth Eze",
    role: "Gathering direction",
    bio: "Ruth holds the purpose of the day and the tone of the room. She has shepherded the annual gathering since the first edition.",
    imageSrc: "/images/minister-chioma.jpg",
    imageAlt: "Portrait of Ruth Eze",
  },
  {
    name: "Kemi Ajayi",
    role: "Operations",
    bio: "Kemi keeps volunteer teams, venue flow and timing honest. Her work is to make the day feel unhurried.",
    imageSrc: "/images/minister-amara.jpg",
    imageAlt: "Portrait of Kemi Ajayi",
  },
  {
    name: "Ibrahim Sule",
    role: "Communications",
    bio: "Ibrahim writes the reminders, the website copy and the quiet messages that help people arrive prepared.",
    imageSrc: "/images/minister-daniel.jpg",
    imageAlt: "Portrait of Ibrahim Sule",
  },
];

export const previousImpact = {
  year: 2025,
  theme: "Behold Him",
  summary:
    "The first annual edition proved the format: one hall in Ikeja, a short word, and a people who came to sing rather than to watch.",
  notes: [
    "A single-session gathering rather than a conference weekend.",
    "Volunteer teams covering welcome, prayer, media and logistics.",
    "A photographic record in the gallery, never a public roll of names.",
  ],
};
