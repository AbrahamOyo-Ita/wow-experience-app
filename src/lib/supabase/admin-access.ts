import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasAdminPermission, isAdminRole, type AdminPermission } from "@/lib/admin-rbac";
import type { AdminRole } from "@/types";

const DEFAULT_SUPER_ADMIN_EMAILS = ["oyoitaabraham@gmail.com"];

function configuredSuperAdminEmails() {
  const configured = process.env.SUPER_ADMIN_EMAILS?.split(",") ?? [];
  return new Set(
    [...DEFAULT_SUPER_ADMIN_EMAILS, ...configured]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function ensureSuperAdminRole(userId: string, email?: string | null) {
  if (!hasServiceRole()) return false;

  const admin = createAdminClient();
  let userEmail = email?.trim().toLowerCase() ?? "";

  if (!userEmail) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user?.email) return false;
    userEmail = data.user.email.toLowerCase();
  }

  if (!configuredSuperAdminEmails().has(userEmail)) return false;

  const fullName = userEmail.split("@")[0] || "Admin";
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    email: userEmail,
    full_name: fullName,
  });
  if (profileError) return false;

  const { error: roleError } = await admin.from("profile_roles").upsert({
    profile_id: userId,
    role: "super_admin",
  });

  return !roleError;
}

export type AdminAuthorization = {
  userId: string;
  email: string;
  role: AdminRole;
};

export async function authorizeAdmin(permission: AdminPermission): Promise<AdminAuthorization | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return null;

  const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
    supabase.from("profile_roles").select("role").eq("profile_id", userId).limit(1).maybeSingle(),
    supabase.from("profiles").select("status").eq("id", userId).maybeSingle(),
  ]);
  if (!isAdminRole(roleRow?.role) || profileRow?.status === "disabled") return null;
  if (!hasAdminPermission(roleRow.role, permission)) return null;

  return {
    userId,
    email: typeof claimsData?.claims?.email === "string" ? claimsData.claims.email : "",
    role: roleRow.role,
  };
}
