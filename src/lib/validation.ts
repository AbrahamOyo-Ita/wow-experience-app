import { z } from "zod";
import { normalizeNgPhone } from "@/lib/phone";

export const rsvpSchema = z
  .object({
    firstName: z.string().trim().min(2, "Enter your first name."),
    phone: z.string().trim().min(7, "Enter a valid Nigerian WhatsApp number."),
    email: z.string().trim().optional(),
    preferredChannel: z.enum(["whatsapp", "email", "both"]),
    whatsappConsent: z.boolean(),
    emailConsent: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!normalizeNgPhone(value.phone)) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a valid Nigerian WhatsApp number.",
      });
    }
    if (value.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Enter a valid email or leave this blank.",
        });
      }
    }
    if (value.preferredChannel !== "whatsapp" && !value.email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required when email reminders are selected.",
      });
    }
    if (value.preferredChannel !== "email" && !value.whatsappConsent) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsappConsent"],
        message: "Confirm WhatsApp reminders to continue.",
      });
    }
    if (value.preferredChannel !== "whatsapp" && !value.emailConsent) {
      ctx.addIssue({
        code: "custom",
        path: ["emailConsent"],
        message: "Confirm email reminders to continue.",
      });
    }
  });

export const volunteerSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid WhatsApp number."),
  occupation: z.string().trim().min(2, "Tell us your occupation."),
  location: z.string().trim().min(2, "Tell us your location."),
  teamId: z.string().min(1, "Choose a team."),
  experience: z.string().trim().min(8, "Share a little relevant experience."),
  availability: z.string().trim().min(4, "Tell us when you can serve."),
  motivation: z.string().trim().min(12, "Tell us why you want to serve."),
  consentWhatsApp: z.boolean().refine((value) => value === true, {
    message: "Application updates require WhatsApp consent.",
  }),
  consentEmail: z.boolean().refine((value) => value === true, {
    message: "Application updates require email consent.",
  }),
});

export const attendanceSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid WhatsApp number."),
  occupation: z.string().trim().min(2, "Enter your occupation."),
  consentAttendance: z
    .boolean()
    .refine((value) => value === true, {
      message: "Confirm attendance recording to continue.",
    }),
  consentReminders: z.boolean(),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  message: z.string().trim().min(12, "Please write a little more so we can help."),
});

export const unsubscribeSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    channel: z.enum(["email", "whatsapp", "both"]),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Provide an email address or WhatsApp number.",
      });
    }
  });

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  name: z.string().trim().max(120, "Keep the name under 120 characters.").optional(),
  source: z.string().trim().max(80).optional(),
});

export const campaignScheduleSchema = z
  .object({
    eventId: z.string().trim().min(1, "Choose an edition."),
    name: z.string().trim().min(2, "Enter a campaign title."),
    subject: z.string().trim().max(180, "Keep the subject under 180 characters.").optional(),
    channelMode: z.enum(["whatsapp", "email", "both", "fallback"]),
    audienceLabel: z.string().trim().min(2, "Choose an audience."),
    whatsappBody: z.string().trim().optional(),
    emailBody: z.string().trim().optional(),
    scheduledAt: z.string().trim().optional(),
    targetContactIds: z.array(z.string().uuid()).optional(),
    sendNow: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.channelMode !== "email" && !value.whatsappBody) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsappBody"],
        message: "Write a WhatsApp message for this channel.",
      });
    }
    if (value.channelMode !== "whatsapp" && !value.emailBody) {
      ctx.addIssue({
        code: "custom",
        path: ["emailBody"],
        message: "Write an email body for this channel.",
      });
    }
    if (value.channelMode !== "whatsapp" && !value.subject) {
      ctx.addIssue({
        code: "custom",
        path: ["subject"],
        message: "Add a subject for email delivery.",
      });
    }
  });

export const newsletterPublishSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Enter a newsletter title."),
  subject: z.string().trim().min(2, "Enter an email subject.").max(180),
  excerpt: z.string().trim().max(240).optional(),
  body: z.string().trim().min(12, "Write the newsletter body."),
  publish: z.boolean().optional(),
});

export const ministerSchema = z.object({
  id: z.string().trim().max(100).optional(),
  editionId: z.string().trim().regex(/^[a-z0-9-]+$/i, "Choose a valid edition."),
  name: z.string().trim().min(2, "Enter the minister's name.").max(120),
  role: z.string().trim().max(120),
  bio: z.string().trim().max(2000),
  imageSrc: z.string().trim().max(2000).optional(),
  imageAlt: z.string().trim().max(180).optional(),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number().int().min(1).max(1000),
});

export function flattenZodErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
