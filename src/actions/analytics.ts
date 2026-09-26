"use server";

import { createClient } from "@/lib/supabase/server";

export type AnalyticsListItem = { label: string; value: number };
export type AnalyticsSnapshot = {
  days: number;
  pageViews: number;
  visitors: number;
  sessions: number;
  viewsPerSession: number;
  bounceRate: number;
  liveVisitors: number;
  daily: { date: string; views: number; visitors: number }[];
  topPages: AnalyticsListItem[];
  countries: AnalyticsListItem[];
  cities: AnalyticsListItem[];
  sources: AnalyticsListItem[];
  devices: AnalyticsListItem[];
  referrers: AnalyticsListItem[];
};

export type AnalyticsResult =
  | { status: "success"; data: AnalyticsSnapshot }
  | { status: "error"; message: string };

export async function loadAnalyticsSnapshot(days = 30): Promise<AnalyticsResult> {
  const range = [7, 30, 90, 365].includes(days) ? days : 30;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return { status: "error", message: "Sign in to view analytics." };

  const { data: roles, error: roleError } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", userId)
    .limit(1);
  if (roleError || !roles?.length) {
    return { status: "error", message: "Admin access is required." };
  }

  const { data, error } = await supabase.rpc("get_analytics_dashboard", { p_days: range });
  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? "Analytics are unavailable until the latest database migration is applied.",
    };
  }
  return { status: "success", data: data as AnalyticsSnapshot };
}

