import type { SitePlaceholders } from "@/types";

export const SITE: SitePlaceholders = {
  organizationName: "Wonders of Worship Experience",
  eventSeriesName: "Wonders of Worship Experience",
  contactEmail: "hello@wonderexperience.org",
  contactPhone: "+234 800 000 0000",
  instagram: "https://instagram.com/wonderexperience",
  youtube: "https://youtube.com/@wonderexperience",
  whatsappDisplay: "+234 800 000 0000",
  policyVersion: "2026.1",
  social: {
    instagram: "https://instagram.com/wonderexperience",
    youtube: "https://youtube.com/@wonderexperience",
    x: "https://x.com/wonderexperience",
  },
};

export const CURRENT_EDITION_YEAR = 2026;
export const CURRENT_EDITION_ID = "edition-2026";

export const TEMPLATE_VARIABLES = [
  "first_name",
  "event_name",
  "event_date",
  "event_time",
  "venue",
  "directions_url",
  "gallery_url",
  "volunteer_team",
  "whatsapp_group_url",
] as const;
