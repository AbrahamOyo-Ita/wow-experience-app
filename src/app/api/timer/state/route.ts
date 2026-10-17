import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("session")?.trim();
  if (!code || !/^[a-f0-9]{24,64}$/i.test(code)) return NextResponse.json({ error: "Invalid timer session." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("timer_display_state").select("*").eq("public_code", code).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Timer session not found." }, { status: 404 });
  return NextResponse.json({ ...data, serverNow: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
