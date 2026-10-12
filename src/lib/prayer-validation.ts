import { z } from "zod";

export const prayerRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .max(120, "Keep your name under 120 characters.")
    .optional(),
  prayerPoint: z
    .string()
    .trim()
    .min(10, "Please write a little more so we can pray with understanding.")
    .max(2000, "Keep your prayer point under 2,000 characters."),
  desiredOutcome: z
    .string()
    .trim()
    .min(5, "Tell us what you are trusting God to do at the event.")
    .max(1000, "Keep this response under 1,000 characters."),
  isAnonymous: z.boolean(),
  isUrgent: z.boolean(),
  source: z.string().trim().max(80).optional(),
});
