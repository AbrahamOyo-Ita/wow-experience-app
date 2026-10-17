import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/supabase/admin-access";
import { applyTimerCommand, getTimerBundle } from "@/lib/timer/server";

export async function GET() {
  const authorization = await authorizeAdmin("timer.manage");
  if (!authorization) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getTimerBundle()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load timer." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin("timer.manage");
  if (!authorization) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await applyTimerCommand(await request.json(), authorization.userId)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Timer action failed." }, { status: 500 }); }
}
