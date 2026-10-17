import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { enqueueCampaignSend, processCampaign } from "@/lib/notifications/campaign-pipeline";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!hasServiceRole()) return NextResponse.json({ error: "Server email processing is not configured." }, { status: 503 });
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ error: "Cron integration is not configured." }, { status: 503 });

  const supabase = createAdminClient();
  const { data: campaigns, error } = await supabase.from("campaigns").select("id").eq("type", "automation").eq("status", "scheduled").lte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: { id: string; status: string; error?: string }[] = [];
  for (const campaign of campaigns ?? []) {
    try {
      const { data: claimed } = await supabase.from("campaigns").update({ status: "queueing" }).eq("id", campaign.id).eq("status", "scheduled").select("id").maybeSingle();
      if (!claimed) continue;
      await enqueueCampaignSend(campaign.id);
      const result = await processCampaign(campaign.id);
      results.push({ id: campaign.id, status: result.failed ? "partial" : "completed" });
    } catch (campaignError) {
      const message = campaignError instanceof Error ? campaignError.message : "Unknown campaign error.";
      await supabase.from("campaigns").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", campaign.id);
      results.push({ id: campaign.id, status: "failed", error: message });
    }
  }
  return NextResponse.json({ processed: results.length, campaigns: results });
}

export async function POST(request: Request) { return run(request); }
export async function GET(request: Request) { return run(request); }
