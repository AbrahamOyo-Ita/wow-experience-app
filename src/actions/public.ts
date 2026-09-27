"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { newsletterSubscribeSchema, rsvpSchema } from "@/lib/validation";
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

  const requestId = crypto.randomUUID();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(name, {
      payload: { ...payload, ipHash: await ipHash() },
    });

    if (error) {
      console.error("Public Supabase RPC failed", {
        requestId,
        rpc: name,
        code: error.code,
        details: error.details,
      });
      return {
        status: "error",
        message: `We could not complete that request. Please try again. Reference: ${requestId}`,
      };
    }

    const result = data as MockSubmitResult<T> | null;
    if (!result?.status) {
      console.error("Public Supabase RPC returned an invalid result", { requestId, rpc: name });
      return {
        status: "error",
        message: `We could not complete that request. Please try again. Reference: ${requestId}`,
      };
    }
    return result;
  } catch (error) {
    console.error("Public Supabase RPC threw", {
      requestId,
      rpc: name,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      status: "error",
      message: `The connection was interrupted. Please try again. Reference: ${requestId}`,
    };
  }
}

export async function submitRsvp(input: RsvpInput) {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "validation" as const,
      errors: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "form"),
        message: issue.message,
      })),
    };
  }

  return callRpc<Rsvp>("submit_rsvp", {
    ...parsed.data,
    editionId: input.editionId,
    eventId: input.eventId,
    source: input.source,
  });
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

export type PublishedFlyerResult = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  imageUrl: string;
  published: boolean;
  updatedAt: string;
};

export async function getPublishedFlyerAction(): Promise<PublishedFlyerResult | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("flyer_templates")
      .select("id, name, file_name, mime_type, image_url, is_published, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      fileName: data.file_name,
      mimeType: data.mime_type,
      imageUrl: data.image_url,
      published: data.is_published,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error("Failed to load published flyer template", err);
    return null;
  }
}

