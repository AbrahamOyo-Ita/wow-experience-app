"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { newsletterSubscribeSchema } from "@/lib/validation";
import type {
  AttendanceInput,
  EnquiryInput,
  MockSubmitResult,
  NewsletterSubscribeInput,
  RsvpInput,
  UnsubscribeInput,
  VolunteerInput,
} from "@/services/contracts";
import type { AttendanceRecord, Newsletter, NewsletterSubscriber, Rsvp, VolunteerApplication } from "@/types";

async function ipHash() {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const bytes = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function callRpc<T>(
  name: string,
  payload: Record<string, unknown>,
): Promise<MockSubmitResult<T>> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, {
    payload: { ...payload, ipHash: await ipHash() },
  });

  if (error) {
    return {
      status: "error",
      message: error.message || "The request could not be completed. Try again.",
    };
  }

  const result = data as MockSubmitResult<T> | null;
  if (!result?.status) {
    return { status: "error", message: "The request could not be completed. Try again." };
  }
  return result;
}

export async function submitRsvp(input: RsvpInput) {
  return callRpc<Rsvp>("submit_rsvp", { ...input });
}

export async function declineRsvp(eventId: string) {
  const result = await callRpc<{ recorded: true }>("decline_rsvp", { eventId });
  if (result.status === "success") return { recorded: true as const };
  return { recorded: true as const };
}

export async function submitVolunteer(input: VolunteerInput) {
  return callRpc<VolunteerApplication>("submit_volunteer", { ...input });
}

export async function checkInAttendance(input: AttendanceInput & { source?: "qr" | "admin" }) {
  return callRpc<AttendanceRecord>("check_in_attendance", { ...input });
}

export async function submitEnquiry(input: EnquiryInput) {
  return callRpc<{ id: string }>("submit_enquiry", { ...input });
}

export async function unsubscribeContact(input: UnsubscribeInput) {
  return callRpc<{ id: string }>("unsubscribe_contact", { ...input });
}

export async function subscribeNewsletter(
  input: NewsletterSubscribeInput,
): Promise<MockSubmitResult<NewsletterSubscriber>> {
  const parsed = newsletterSubscribeSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "validation", errors: parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? "email"),
      message: issue.message,
    })) };
  }

  const result = await callRpc<NewsletterSubscriber>("subscribe_newsletter", {
    ...parsed.data,
    source: parsed.data.source ?? "footer",
  });
  if (result.status === "success" || result.status === "existing") {
    revalidatePath("/newsletters");
  }
  return result;
}

export async function listPublishedNewsletters(): Promise<Newsletter[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) return [];
  return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    subject: String(row.subject),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body),
    status: "published",
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}
