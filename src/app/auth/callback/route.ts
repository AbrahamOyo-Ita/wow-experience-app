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
  const type = (requestUrl.searchParams.get("type") || "magiclink") as string;
  const next = safeAdminNext(requestUrl.searchParams.get("next"));
  const redirectUrl = request.nextUrl.clone();

  const supabase = await createClient();

  // Handle PKCE code exchange (standard OAuth/magic-link PKCE flow)
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
  // Handle token_hash + type (invite / recovery / email-change OTP flow)
  else if (tokenHash) {
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
  }
  // No valid token params — redirect to login
  else {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  // Session established — get the user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  // Ensure super admin role for the primary admin email
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

  // Ensure role is assigned (only if not already set)
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

  // Determine if this is a new account (needs password setup)
  const isInviteFlow =
    type === "invite" ||
    type === "signup" ||
    next.includes("set-password") ||
    // If user has never had a confirmed sign-in before this session, they're new
    !user.last_sign_in_at;

  if (isInviteFlow) {
    redirectUrl.pathname = "/admin/set-password";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Regular magic-link sign-in → go to admin
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

  redirectUrl.pathname = next;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}
