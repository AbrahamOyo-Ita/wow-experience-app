import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/supabase/admin-access";
import { forceRetryFailed } from "@/lib/notifications/campaign-pipeline";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdmin("automations.manage")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    return NextResponse.json(await forceRetryFailed(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Retry failed." }, { status: 500 });
  }
}
