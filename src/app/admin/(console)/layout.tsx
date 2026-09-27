import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataProvider } from "@/components/admin/admin-data";
import { ensureSuperAdminRole } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) {
      redirect("/admin/login");
    }
    await ensureSuperAdminRole(
      data.claims.sub as string,
      typeof data.claims.email === "string" ? data.claims.email : null,
    );
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("profile_roles").select("role").eq("profile_id", data.claims.sub as string),
      supabase.from("profiles").select("status").eq("id", data.claims.sub as string).maybeSingle(),
    ]);
    if (!roles?.length || profile?.status !== "active") {
      redirect("/admin/login?error=forbidden");
    }
  }

  return (
    <AdminDataProvider>
      <AdminShell>{children}</AdminShell>
    </AdminDataProvider>
  );
}
