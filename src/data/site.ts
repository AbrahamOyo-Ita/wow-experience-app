import type { SitePlaceholders } from "@/types";

export const SITE: SitePlaceholders = {
  organizationName: "Wonders of Worship Experience",
  eventSeriesName: "Wonders of Worship Experience",
  contactEmail: "hello@wowexperience.com.ng",
  contactPhone: "+234 810 165 4190",
  instagram: "https://instagram.com/wonderexperience",
  youtube: "https://youtube.com/@wowexperience-f9n?si=LQe_yZ_fjd-CdOcT",
  whatsappDisplay: "+234 810 165 4190",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+234 810 165 4190",
  polo: {
    name: "Official WOW Experience Resound Polo",
    price: 6000,
    currency: "NGN",
    colors: [
      {
        name: "Purple",
        slug: "purple",
        imageSrc: "/images/WOW_RESOUND POLO PURPLE.png",
        swatchClass: "bg-[#4b256f]",
      },
      {
        name: "Red",
        slug: "red",
        imageSrc: "/images/WOW_RESOUND POLO RED.png",
        swatchClass: "bg-red",
      },
      {
        name: "Black",
        slug: "black",
        imageSrc: "/images/WOW_RESOUND POLO BLACK.png",
        swatchClass: "bg-ink",
      },
      {
        name: "White",
        slug: "white",
        imageSrc: "/images/WOW_RESOUND POLO WHITE.png",
        swatchClass: "bg-white",
      },
    ],
    sizes: ["Medium", "Large", "Xtra Large", "XXL"],
  },
  policyVersion: "2026.1",
  social: {
    youtube: "https://youtube.com/@wowexperience-f9n?si=LQe_yZ_fjd-CdOcT",
    facebook: "https://www.facebook.com/share/1Bvd8mUwih/",
    tiktok: "https://tiktok.com/@wow.experience4",
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
