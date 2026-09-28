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
    id: "gal-drive-folder-1",
    editionId: "edition-2025",
    title: "Archive Collection 1",
    description: "Browse high-resolution photo archives on Google Drive.",
    coverSrc: "/images/IMG_2311.jpg",
    coverAlt: "Worship gathering photo archive",
    aspect: "landscape",
    photoCount: 0,
    driveUrl: "https://drive.google.com/drive/folders/1WFHGwCd8871lpNg2upeB9LVyI84VVRJn",
  },
  {
    id: "gal-drive-folder-2",
    editionId: "edition-2025",
    title: "Archive Collection 2",
    description: "Browse high-resolution photo archives on Google Drive.",
    coverSrc: "/images/IMG_2581.jpg",
    coverAlt: "Media and worship photo archive",
    aspect: "landscape",
    photoCount: 0,
    driveUrl: "https://drive.google.com/drive/folders/1_Ppn43OQ6zDatzDz84b1mXN2xiTmVMrk",
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
    title: "Christ, Always at the Center",
    body: "It has always been Jesus. Beyond the lights, music, stage and moments we capture, our greatest desire is that hearts see Him, know Him and encounter Him.",
  },
  {
    title: "Worship Beyond Performance",
    body: "You’re not coming to watch from the sidelines. You’re part of the worship. Every voice, every lifted hand and every heart surrendered matters here.",
  },
  {
    title: "One Room. One Heart.",
    body: "Different churches. Different schools. Different generations. One room, gathered with one desire, to lift Jesus and experience His presence together.",
  },
  {
    title: "Excellence with Purpose",
    body: "We give our best because worship deserves intentionality. From the sound to the stage, media, hospitality and every unseen detail, everything serves the encounter.",
  },
  {
    title: "People Before Numbers",
    body: "There’s room for you here. Whether worship feels familiar or you’re still discovering what it means, you are welcome to come, experience God and respond freely.",
  },
  {
    title: "We Leave Changed",
    body: "The night may end, but the encounter shouldn’t. Our prayer is that you leave with more than memories. A heart awakened, faith strengthened and a deeper hunger for God.",
  },
];

export const organizingTeam = [
  {
    name: "Pastor Nsemeke David",
    role: "Host Pastor",
    imageSrc: "/images/Pastor Nsemeke David_Host Pastor_1st.webp",
    imageAlt: "Portrait of Pastor Nsemeke David",
  },
  {
    name: "Pastor Evelyn Isua-ikoh",
    role: "National Teens & Children Coordinator",
    imageSrc: "/images/Pastor Evelyn Isua-ikoh_National Teens & Children Coordinators_3rd.webp",
    imageAlt: "Portrait of Pastor Evelyn Isua-ikoh",
  },
  {
    name: "Barr. David Etido",
    role: "Coordinator",
    imageSrc: "/images/Barr. David Etido_ Coordinator_3rd.webp",
    imageAlt: "Portrait of Barr. David Etido",
  },
  {
    name: "Patience Tim",
    role: "Assistant Coordinator",
    imageSrc: "/images/Patience Tim_Assistant Coordinators_4th.webp",
    imageAlt: "Portrait of Patience Tim",
  },
  {
    name: "Philip Essien",
    role: "Convener, WOW Experience",
    imageSrc: "/images/Philip Essien_Convener_WOW Experience.png",
    imageAlt: "Portrait of Philip Essien",
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
