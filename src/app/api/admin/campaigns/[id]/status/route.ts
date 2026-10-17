import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/supabase/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdmin("automations.manage")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const supabase = createAdminClient();
  const [{ data: campaign, error }, { data: recipients, error: recipientsError }] = await Promise.all([
    supabase.from("campaigns").select("id, status, scheduled_at, sent_count, failed_count, eligible_count, excluded_count, completed_at").eq("id", id).maybeSingle(),
    supabase.from("campaign_recipients").select("id, contact_id, email, status, attempt_count, last_error, last_attempt_at, sent_at").eq("campaign_id", id).order("created_at", { ascending: false }).limit(500),
  ]);
  if (error || recipientsError || !campaign) return NextResponse.json({ error: error?.message ?? recipientsError?.message ?? "Campaign not found." }, { status: 404 });
  const rows = recipients ?? [];
  return NextResponse.json({ campaign, counts: {
    total: rows.length,
    sent: rows.filter((row) => row.status === "sent").length,
    failed: rows.filter((row) => row.status === "failed").length,
    skipped: rows.filter((row) => row.status === "skipped").length,
    pending: rows.filter((row) => row.status === "pending" || row.status === "processing").length,
  }, recipients: rows });
}
