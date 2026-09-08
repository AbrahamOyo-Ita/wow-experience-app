import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

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
