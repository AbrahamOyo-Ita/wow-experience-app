import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const payloadSchema = z.object({
  path: z.string().min(1).max(500).startsWith("/"),
  referrer: z.string().url().max(2_000).nullable().optional(),
  utmSource: z.string().max(100).nullable().optional(),
  utmMedium: z.string().max(100).nullable().optional(),
  utmCampaign: z.string().max(150).nullable().optional(),
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BOT_PATTERN = /bot|crawler|spider|crawling|headless|preview|facebookexternalhit|slurp/i;

function safeHeader(value: string | null, max: number) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).slice(0, max);
  } catch {
    return value.slice(0, max);
  }
}

function deviceCategory(userAgent: string) {
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function sourceFor(referrerHost: string | null, utmSource: string | null | undefined) {
  if (utmSource) return utmSource.slice(0, 100);
  if (!referrerHost || referrerHost.endsWith("wowexperience.com.ng")) return null;
  return referrerHost;
}

export async function POST(request: NextRequest) {
  if (!hasServiceRole() || request.headers.get("dnt") === "1") {
    return new NextResponse(null, { status: 204 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) return new NextResponse(null, { status: 204 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_192) return NextResponse.json({ error: "Payload too large." }, { status: 413 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success || parsed.data.path.startsWith("/admin") || parsed.data.path.startsWith("/api")) {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }

  const visitorCookie = request.cookies.get("wow_vid")?.value;
  const sessionCookie = request.cookies.get("wow_sid")?.value;
  const visitorId = visitorCookie && UUID_PATTERN.test(visitorCookie) ? visitorCookie : crypto.randomUUID();
  const sessionId = sessionCookie && UUID_PATTERN.test(sessionCookie) ? sessionCookie : crypto.randomUUID();
  let referrerHost: string | null = null;
  if (parsed.data.referrer) {
    try {
      referrerHost = new URL(parsed.data.referrer).hostname.slice(0, 255);
    } catch {
      referrerHost = null;
    }
  }

  const country = safeHeader(request.headers.get("x-vercel-ip-country"), 2)?.toUpperCase() ?? null;
  const admin = createAdminClient();
  const { error } = await admin.from("analytics_events").insert({
    visitor_id: visitorId,
    session_id: sessionId,
    path: parsed.data.path,
    referrer_host: referrerHost,
    source: sourceFor(referrerHost, parsed.data.utmSource),
    utm_source: parsed.data.utmSource || null,
    utm_medium: parsed.data.utmMedium || null,
    utm_campaign: parsed.data.utmCampaign || null,
    country_code: country && /^[A-Z]{2}$/.test(country) ? country : null,
    region: safeHeader(request.headers.get("x-vercel-ip-country-region"), 120),
    city: safeHeader(request.headers.get("x-vercel-ip-city"), 120),
    device_category: deviceCategory(userAgent),
  });

  if (error) {
    console.error("Analytics event insert failed:", error.message);
    return new NextResponse(null, { status: 204 });
  }

  const response = new NextResponse(null, { status: 204 });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("wow_vid", visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set("wow_sid", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 30,
  });
  return response;
}

