import { CURRENT_EDITION_ID } from "@/data/site";
import type { GalleryAlbum, VolunteerTeam } from "@/types";

export const volunteerTeams: VolunteerTeam[] = [
  {
    id: "team-media",
    editionId: CURRENT_EDITION_ID,
    name: "Media",
    slug: "media",
    description: "Manage lyric screens, sound, lighting, photography, and live production visuals.",
    expectation: "Arrive for early sound check and maintain quiet reverence during prayer and worship.",
    capacity: 12,
    status: "open",
  },
  {
    id: "team-prayer",
    editionId: CURRENT_EDITION_ID,
    name: "Prayer & Intercession",
    slug: "prayer",
    description: "Stand in prayer before the gathering and facilitate intercession and altar ministry.",
    expectation: "Join pre-event intercession sessions and remain available throughout the gathering.",
    capacity: 15,
    status: "open",
  },
  {
    id: "team-publicity",
    editionId: CURRENT_EDITION_ID,
    name: "Publicity & Outreach",
    slug: "publicity",
    description: "Spread the word across Uyo, campuses, churches, and digital communities.",
    expectation: "Actively participate in pre-gathering campaigns and outreach distribution.",
    capacity: 20,
    status: "open",
  },
  {
    id: "team-protocol",
    editionId: CURRENT_EDITION_ID,
    name: "Protocol & Order",
    slug: "protocol",
    description: "Ensure orderly flow, reserved seating, minister support, and venue decorum.",
    expectation: "Arrive 90 minutes early to oversee venue order and minister reception.",
    capacity: 10,
    status: "open",
  },
  {
    id: "team-ushering",
    editionId: CURRENT_EDITION_ID,
    name: "Ushering & Hospitality",
    slug: "ushering",
    description: "Welcome attendees at the doors, assist seating, and maintain a warm, orderly environment.",
    expectation: "Arrive by 7:15 AM on gathering day and assist until guests depart.",
    capacity: 25,
    status: "open",
  },
  {
    id: "team-registration",
    editionId: CURRENT_EDITION_ID,
    name: "Registration & Check-In",
    slug: "registration",
    description: "Scan QR codes, verify attendee RSVPs, and manage physical check-in desks.",
    expectation: "Arrive by 7:00 AM to set up registration tables and check-in devices.",
    capacity: 15,
    status: "open",
  },
  {
    id: "team-content-creators",
    editionId: CURRENT_EDITION_ID,
    name: "Content Creators",
    slug: "content-creators",
    description: "Capture reels, social media highlights, testimonies, and creative video content.",
    expectation: "Collaborate with media team to produce real-time gathering content and highlights.",
    capacity: 10,
    status: "open",
  },
];

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "gal-2025-gathering",
    editionId: "edition-2025",
    title: "The 2025 Inaugural Gathering Archive",
    description: "Full high-resolution photograph archive and worship highlights from our maiden gathering.",
    coverSrc: "/images/gallery-gathering.jpg",
    coverAlt: "Congregation gathered in 2025",
    aspect: "landscape",
    photoCount: 42,
    driveUrl: "https://drive.google.com/drive/folders/1WFHGwCd8871lpNg2upeB9LVyI84VVRJn",
  },
  {
    id: "gal-2025-serve",
    editionId: "edition-2025",
    title: "Media & Worship Highlights Archive",
    description: "Curated photo collection capturing volunteer service, worship ministers, and altar moments.",
    coverSrc: "/images/volunteer-serve.jpg",
    coverAlt: "Volunteers serving at the hall",
    aspect: "landscape",
    photoCount: 36,
    driveUrl: "https://drive.google.com/drive/folders/1_Ppn43OQ6zDatzDz84b1mXN2xiTmVMrk",
  },
  {
    id: "gal-2026-rehearsal",
    editionId: CURRENT_EDITION_ID,
    title: "2026 Rehearsals & Preparation",
    description: "Behind the scenes as ministers and teams prepare for the Uyo gathering.",
    coverSrc: "/images/experience-stage.jpg",
    coverAlt: "Stage lights during worship preparation",
    aspect: "landscape",
    photoCount: 18,
    driveUrl: "https://drive.google.com/drive/folders/1WFHGwCd8871lpNg2upeB9LVyI84VVRJn",
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
    name: "Pst. Nsemeke David",
    role: "Host Pastor",
    bio: "Providing spiritual fatherhood, leadership oversight, and pastoral direction for Wonders of Worship Experience.",
    imageSrc: "/images/headshot-nsemeke.png",
    imageAlt: "Portrait of Pst. Nsemeke David",
  },
  {
    name: "Pastor Evelyn Isua-ikoh",
    role: "National Teens & Children Coordinator",
    bio: "Overseeing the vision, spiritual nurture, and coordination for children and teens across our gatherings nationwide.",
    imageSrc: "/images/headshot-evelyn.jpg",
    imageAlt: "Portrait of Pastor Evelyn Isua-ikoh",
  },
  {
    name: "Barr. David Etido",
    role: "Coordinator",
    bio: "Coordinating overall vision, team administration, and strategic execution across all Wonders of Worship Experience editions.",
    imageSrc: "/images/headshot-david.jpg",
    imageAlt: "Portrait of Barr. David Etido",
  },
  {
    name: "Patience Tim",
    role: "Assistant Coordinator",
    bio: "Assisting in operational coordination, team synergy, and gathering administration for Wonders of Worship Experience.",
    imageSrc: "/images/headshot-patience.jpg",
    imageAlt: "Portrait of Patience Tim",
  },
];

export const previousImpact = {
  year: 2025,
  theme: "RESOUND",
  scripture: "Revelation 19:6",
  summary:
    "Our inaugural gathering established our foundational pattern under theme RESOUND (Revelation 19:6): one room, a focused message, and hours dedicated to congregational worship.",
  notes: [
    "Single-day focused worship gathering built around deep reverence.",
    "Dedicated volunteer teams covering hospitality, intercession, media, and venue flow.",
    "A lasting record preserved in gallery archives for the community.",
  ],
};
