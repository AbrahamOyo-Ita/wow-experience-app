import { NextResponse, type NextRequest } from "next/server";
import { ensureSuperAdminRole } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";

function safeAdminNext(value: string | null) {
  return value?.startsWith("/admin") ? value : "/admin";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAdminNext(requestUrl.searchParams.get("next"));
  const redirectUrl = request.nextUrl.clone();

  if (!code) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) {
    await supabase.auth.signOut();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }
  await ensureSuperAdminRole(userId);

  const { data: role } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (!role) {
    await supabase.auth.signOut();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = next;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}
