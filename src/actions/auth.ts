"use server";

import { redirect } from "next/navigation";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { ensureSuperAdminRole } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";

const ADMIN_LOGIN_PATH = "/admin/login";

function safeAdminNext(value: string) {
  return value.startsWith("/admin") ? value : "/admin";
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = safeAdminNext(next);

  if (!email || !password) {
    redirect(`/admin/login?error=missing&next=${encodeURIComponent(safeNext)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
  }

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
  }

  const userId = data.claims.sub as string | undefined;
  if (!userId) {
    await supabase.auth.signOut();
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
  }
  await ensureSuperAdminRole(userId, email);

  const { data: role } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (!role) {
    await supabase.auth.signOut();
    redirect(`/admin/login?error=forbidden&next=${encodeURIComponent(safeNext)}`);
  }

  redirect(safeNext);
}

export async function sendAdminMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = safeAdminNext(next);
  const sentUrl = `${ADMIN_LOGIN_PATH}?magic=sent&next=${encodeURIComponent(safeNext)}`;

  if (!email || !hasServiceRole()) {
    redirect(sentUrl);
  }

  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.users.find((item) => item.email?.toLowerCase() === email);

  if (!user) {
    redirect(sentUrl);
  }
  await ensureSuperAdminRole(user.id, user.email);

  const { data: role } = await admin
    .from("profile_roles")
    .select("role")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!role) {
    redirect(sentUrl);
  }

  const appUrl = process.env.APP_URL || "https://wow-experience-app.vercel.app";
  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${appUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  redirect(sentUrl);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateAccountPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 6) {
    redirect("/admin/set-password?error=short");
  }

  if (password !== confirmPassword) {
    redirect("/admin/set-password?error=mismatch");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?error=invalid");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/admin/set-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin?success=password_updated");
}

