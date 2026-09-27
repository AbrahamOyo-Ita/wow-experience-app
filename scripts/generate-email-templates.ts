import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  getSupabaseMagicLinkTemplate,
  getSupabasePasswordResetTemplate,
  getSupabaseInviteUserTemplate,
  getSupabaseConfirmSignupTemplate,
  getSupabaseChangeEmailTemplate,
  renderRsvpEmail,
  renderVolunteerEmail,
  renderCampaignEmail,
} from "../src/lib/notifications/email-template";

const outputDir = join(process.cwd(), "email-templates");
mkdirSync(outputDir, { recursive: true });

const templates = [
  {
    filename: "supabase-magic-link.html",
    title: "Supabase Auth - Magic Link / Sign In",
    data: getSupabaseMagicLinkTemplate(),
  },
  {
    filename: "supabase-reset-password.html",
    title: "Supabase Auth - Reset Password",
    data: getSupabasePasswordResetTemplate(),
  },
  {
    filename: "supabase-invite-user.html",
    title: "Supabase Auth - Invite User",
    data: getSupabaseInviteUserTemplate(),
  },
  {
    filename: "supabase-confirm-signup.html",
    title: "Supabase Auth - Confirm Signup / Verification",
    data: getSupabaseConfirmSignupTemplate(),
  },
  {
    filename: "supabase-change-email.html",
    title: "Supabase Auth - Change Email Address",
    data: getSupabaseChangeEmailTemplate(),
  },
  {
    filename: "app-rsvp-confirmation.html",
    title: "App Notification - Attendee RSVP Confirmation",
    data: {
      subject: "You are confirmed for Wonders of Worship Experience (RESOUND)",
      html: renderRsvpEmail({
        firstName: "Abraham",
        eventName: "Wonders of Worship Experience (RESOUND)",
        eventDate: "November 27, 2026",
        eventTime: "4:00 PM WAT",
        directionsUrl: "https://www.google.com/maps/search/?api=1&query=Sanctified+Mount+Zion+Church+Ibiono+Street+Uyo",
        recipientEmail: "oyoitaabraham@gmail.com",
      }),
    },
  },
  {
    filename: "app-volunteer-receipt.html",
    title: "App Notification - Volunteer Application Received",
    data: {
      subject: "We received your WOW Experience volunteer application",
      html: renderVolunteerEmail({
        firstName: "Abraham",
        eventName: "Wonders of Worship Experience",
        volunteerTeam: "Media & Sound Engineering",
        recipientEmail: "oyoitaabraham@gmail.com",
      }),
    },
  },
  {
    filename: "app-campaign-broadcast.html",
    title: "App Notification - Campaign Broadcast",
    data: {
      subject: "The Sound of Many Waters — WOW Experience 2026",
      html: renderCampaignEmail({
        title: "The Atmosphere is Gathering",
        preheader: "Everything you need to know as we draw closer to the consecrated sanctuary.",
        bodyMarkdown: `Beloved,
        
We are only weeks away from **Wonders of Worship Experience 2026: RESOUND**.

As the scripture declares in *Revelation 19:6*:
> "And I heard as it were the voice of a great multitude, and as the voice of many waters, and as the voice of mighty thunderings, saying, Alleluia: for the Lord God omnipotent reigneth."

### What to Prepare:
- **Consecrated Heart:** Come ready for deep communion and unfiltered praise.
- **Doors & Access:** Sanctified Mount Zion Church gates open promptly at **3:15 PM**.
- **Prayer & Intercession:** Join the intercessory altar daily as we consecrate the sanctuary.

We cannot wait to worship the King of Glory with you.`,
        actionText: "Access Event Details & Prayer Focus",
        actionUrl: "https://www.wowexperience.com.ng",
        recipientEmail: "oyoitaabraham@gmail.com",
      }),
    },
  },
];

console.log("Generating luxury email templates...");

for (const t of templates) {
  const filePath = join(outputDir, t.filename);
  writeFileSync(filePath, t.data.html, "utf-8");
  console.log(`✓ Generated ${t.filename} (Subject: "${t.data.subject}")`);
}

console.log(`\nAll ${templates.length} templates successfully generated in ./email-templates/`);
