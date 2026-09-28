"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { newsletterSubscribeSchema, rsvpSchema } from "@/lib/validation";
import { getArticleBySlug, getPublishedArticles } from "@/data/articles";
import { faqs as staticFaqs, getFaqsByEdition } from "@/data/faqs";
import type {
  AttendanceInput,
  EnquiryInput,
  MockSubmitResult,
  NewsletterSubscribeInput,
  RsvpInput,
  UnsubscribeInput,
  VolunteerInput,
} from "@/services/contracts";
import type {
  Article,
  AttendanceRecord,
  FaqItem,
  Newsletter,
  NewsletterSubscriber,
  Rsvp,
  VolunteerApplication,
} from "@/types";

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
  config: unknown;
};

export async function getPublishedFlyerAction(): Promise<PublishedFlyerResult | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("flyer_templates")
      .select("id, name, file_name, mime_type, image_url, is_published, updated_at, config")
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
      config: data.config,
    };
  } catch (err) {
    console.error("Failed to load published flyer template", err);
    return null;
  }
}

export async function fetchPublishedArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    return getPublishedArticles();
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return getPublishedArticles();
    }

    return data.map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      excerpt: String(row.excerpt ?? ""),
      body: Array.isArray(row.body) ? (row.body as string[]) : [],
      coverImageSrc: String(row.cover_image_src ?? ""),
      coverImageAlt: String(row.cover_image_alt ?? ""),
      author: String(row.author ?? ""),
      authorRole: String(row.author_role ?? ""),
      category: String(row.category ?? "General"),
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      status: (row.status as Article["status"]) ?? "published",
      publishedAt: String(row.published_at ?? row.created_at ?? ""),
      seoTitle: String(row.seo_title ?? ""),
      seoDescription: String(row.seo_description ?? ""),
    }));
  } catch (err) {
    console.error("fetchPublishedArticles failed", err);
    return getPublishedArticles();
  }
}

export async function fetchArticleBySlug(slug: string): Promise<Article | undefined> {
  if (!isSupabaseConfigured()) {
    return getArticleBySlug(slug);
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return getArticleBySlug(slug);
    }

    return {
      id: String(data.id),
      slug: String(data.slug),
      title: String(data.title),
      excerpt: String(data.excerpt ?? ""),
      body: Array.isArray(data.body) ? (data.body as string[]) : [],
      coverImageSrc: String(data.cover_image_src ?? ""),
      coverImageAlt: String(data.cover_image_alt ?? ""),
      author: String(data.author ?? ""),
      authorRole: String(data.author_role ?? ""),
      category: String(data.category ?? "General"),
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      status: (data.status as Article["status"]) ?? "published",
      publishedAt: String(data.published_at ?? data.created_at ?? ""),
      seoTitle: String(data.seo_title ?? ""),
      seoDescription: String(data.seo_description ?? ""),
    };
  } catch (err) {
    console.error("fetchArticleBySlug failed", err);
    return getArticleBySlug(slug);
  }
}

export async function fetchPublishedFaqs(editionId?: string): Promise<FaqItem[]> {
  if (!isSupabaseConfigured()) {
    return editionId ? getFaqsByEdition(editionId) : staticFaqs;
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("*, event_editions(legacy_key)")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return editionId ? getFaqsByEdition(editionId) : staticFaqs;
    }

    const items: FaqItem[] = data.map((row) => ({
      id: String(row.id),
      editionId: row.event_editions
        ? String((row.event_editions as Record<string, unknown>).legacy_key ?? row.edition_id)
        : row.edition_id
        ? String(row.edition_id)
        : null,
      category: (row.category as FaqItem["category"]) ?? "general",
      question: String(row.question),
      answer: String(row.answer),
      order: Number(row.sort_order ?? 1),
    }));

    if (editionId) {
      return items.filter((item) => item.editionId === editionId || item.editionId === null);
    }
    return items;
  } catch (err) {
    console.error("fetchPublishedFaqs failed", err);
    return editionId ? getFaqsByEdition(editionId) : staticFaqs;
  }
}

