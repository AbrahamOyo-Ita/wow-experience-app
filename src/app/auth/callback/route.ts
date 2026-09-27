import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureSuperAdminRole } from "@/lib/supabase/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

function safeAdminNext(value: string | null) {
  if (!value) return "/admin";
  return value.startsWith("/admin") ? value : "/admin";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type"); // "invite", "magiclink", "recovery" etc
  const next = safeAdminNext(requestUrl.searchParams.get("next"));
  const redirectUrl = request.nextUrl.clone();

  const supabase = await createClient();

  // Handle PKCE code exchange (standard OAuth/magic-link flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      redirectUrl.pathname = "/admin/login";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("error", "invalid");
      return NextResponse.redirect(redirectUrl);
    }
  }
  // Handle token_hash verification (invite / email-change / recovery links)
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as Parameters<typeof supabase.auth.verifyOtp>[0]["type"],
    });
    if (error) {
      console.error("[auth/callback] verifyOtp error:", error.message);
      redirectUrl.pathname = "/admin/login";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("error", "invalid");
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // No token at all — redirect to login
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  // Get the newly-established session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  // Ensure the invited user gets their role upserted
  await ensureSuperAdminRole(user.id, user.email);

  // Upsert profile + role from user_metadata (set during invite)
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const metaRole = (meta?.role as string | undefined) || "content_editor";
  const metaDept = (meta?.department as string | undefined) || "Executive Leadership";
  const metaName = (meta?.full_name as string | undefined) || user.email?.split("@")[0] || "Staff Member";

  const admin = createAdminClient();

  // Ensure profile exists
  await admin.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: metaName,
    department: metaDept,
    status: "active",
  });

  // Ensure role is assigned
  const { data: existingRole } = await admin
    .from("profile_roles")
    .select("role")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!existingRole) {
    await admin.from("profile_roles").upsert({
      profile_id: user.id,
      role: metaRole,
    });
  }

  // Check if this is a new invite (no password set) — redirect to set-password
  // Supabase sets last_sign_in_at on first sign-in; if user was invited they may not have a password
  const isInviteFlow =
    type === "invite" ||
    type === "signup" ||
    !user.last_sign_in_at ||
    // If next was explicitly set to set-password
    next.includes("set-password");

  if (isInviteFlow) {
    redirectUrl.pathname = "/admin/set-password";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Check role exists (allow them through if they already have one)
  const { data: roleData } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!roleData) {
    await supabase.auth.signOut();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(redirectUrl);
  }

  // Regular magic-link login — go to admin dashboard
  redirectUrl.pathname = next;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}
