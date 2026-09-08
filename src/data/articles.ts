import type { Article } from "@/types";

export const articles: Article[] = [
  {
    id: "art-posture",
    slug: "the-posture-of-wonder",
    title: "The posture of wonder",
    excerpt:
      "Wonder is not a mood we manufacture. It is what happens when a people look at Christ without rushing to the next song.",
    body: [
      "Wonders of Worship Experience exists because worship can become a programme. Rooms fill, songs start, and nobody has actually looked at Jesus.",
      "Wonder is slower than production. It asks a congregation to stay with a verse, to sing a line until it is true in the mouth, and to let silence do some of the work.",
      "This is why the 2026 gathering is not built as a conference. The schedule is short on announcements and long on congregational singing. The word is brief on purpose.",
      "If you are coming, come ready to stand among a people, not in front of a show. Bring your voice. Bring patience. Leave the need to be impressed at the door.",
      "We will publish practical details as they are confirmed. The invitation itself is already clear: come and behold Him.",
    ],
    coverImageSrc: "/images/insight-posture.jpg",
    coverImageAlt: "A quiet table prepared for reflection",
    author: "Amara Okonkwo",
    authorRole: "Worship lead",
    category: "Worship",
    tags: ["worship", "wonder", "gathering"],
    status: "published",
    publishedAt: "2026-07-12T08:00:00+01:00",
    seoTitle: "The posture of wonder | Wonders of Worship Experience",
    seoDescription:
      "Why Wonders of Worship Experience 2026 is built around congregational singing, Scripture and unhurried attention to Christ.",
  },
  {
    id: "art-gather",
    slug: "why-we-gather",
    title: "Why we gather",
    excerpt:
      "A website can carry information. It cannot replace a room of people singing the same confession at the same time.",
    body: [
      "The internet is useful for dates, directions and reminders. It is a poor substitute for gathered worship.",
      "We still build this site because people need a clear invitation. They need to know when to come, how to serve, and how we will treat their phone number.",
      "The gathering itself remains the point. If the website is doing its job, it disappears on Saturday morning and the room takes over.",
      "That is also why RSVP is not attendance. Saying you will come is a gift to the planning team. Walking in and checking in is the act that tells us you were there.",
    ],
    coverImageSrc: "/images/gallery-gathering.jpg",
    coverImageAlt: "A congregation gathered in a dim hall",
    author: "Daniel Adeyemi",
    authorRole: "Host pastor",
    category: "Gathering",
    tags: ["church", "presence", "rsvp"],
    status: "published",
    publishedAt: "2026-06-20T08:00:00+01:00",
    seoTitle: "Why we gather | Wonders of Worship Experience",
    seoDescription:
      "The difference between an online RSVP and being in the room for Wonders of Worship Experience.",
  },
  {
    id: "art-serve",
    slug: "serving-with-joy",
    title: "Serving with joy",
    excerpt:
      "Volunteer teams are not a backstage workforce. They are part of how the congregation learns to love one another.",
    body: [
      "If you serve in 2026, you are not filling a gap in a production plot. You are helping people arrive, sing, pray and leave well.",
      "That is why the application asks about availability and motivation. We would rather have fewer people who can be present than a large list that cannot be shepherded.",
      "Accepted volunteers receive a WhatsApp group link only after review. The group is a working room, not a public broadcast.",
      "If you are unsure which team to choose, start with hospitality. Almost every healthy gathering is won or lost at the door.",
    ],
    coverImageSrc: "/images/volunteer-serve.jpg",
    coverImageAlt: "Volunteers preparing a hall before a gathering",
    author: "Chioma Nwosu",
    authorRole: "Prayer and hospitality",
    category: "Service",
    tags: ["volunteers", "hospitality", "teams"],
    status: "published",
    publishedAt: "2026-08-03T08:00:00+01:00",
    seoTitle: "Serving with joy | Wonders of Worship Experience",
    seoDescription:
      "How volunteer teams serve the 2026 gathering, and what to expect if you apply.",
  },
  {
    id: "art-reminders",
    slug: "reminders-without-noise",
    title: "Reminders without noise",
    excerpt:
      "We will only message you about the event you asked to be reminded of, on the channel you chose.",
    body: [
      "WhatsApp and email are easy to abuse. This platform is designed to do the opposite.",
      "When you RSVP, you choose WhatsApp, email, or both. Consent is recorded per channel. Decline does not put you on a list.",
      "Reminders are scheduled from the event timezone, Africa/Lagos. The default cadence is two days before and on the morning of the gathering.",
      "You can leave at any time. Unsubscribe links sit in email. WhatsApp opt-out is as simple as sending STOP.",
    ],
    coverImageSrc: "/images/experience-stage.jpg",
    coverImageAlt: "Warm stage lighting in an empty auditorium",
    author: "Communications team",
    authorRole: "Wonders of Worship Experience",
    category: "Practical",
    tags: ["privacy", "whatsapp", "email"],
    status: "published",
    publishedAt: "2026-08-18T08:00:00+01:00",
    seoTitle: "Reminders without noise | Wonders of Worship Experience",
    seoDescription:
      "How RSVP reminders, consent and opt-out work for Wonders of Worship Experience 2026.",
  },
];

export const articleCategories = [
  "All",
  "Worship",
  "Gathering",
  "Service",
  "Practical",
] as const;

export function getPublishedArticles() {
  return articles
    .filter((article) => article.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getArticleBySlug(slug: string) {
  return getPublishedArticles().find((article) => article.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 2) {
  const current = getArticleBySlug(slug);
  if (!current) return getPublishedArticles().slice(0, limit);
  return getPublishedArticles()
    .filter((article) => article.slug !== slug)
    .filter(
      (article) =>
        article.category === current.category ||
        article.tags.some((tag) => current.tags.includes(tag)),
    )
    .slice(0, limit);
}
