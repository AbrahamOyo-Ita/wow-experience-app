"use server";

import { createClient } from "@/lib/supabase/server";
import { authorizeAdmin } from "@/lib/supabase/admin-access";

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
  const authorization = await authorizeAdmin("analytics.view");
  if (!authorization) return { status: "error", message: "You do not have permission to view analytics." };
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_analytics_dashboard", { p_days: range });
  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? "Analytics are unavailable until the latest database migration is applied.",
    };
  }
  return { status: "success", data: data as AnalyticsSnapshot };
}
