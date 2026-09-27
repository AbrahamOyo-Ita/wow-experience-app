"use client";

import { PageHeader, Surface } from "@/components/admin/page-header";
import { WhatsAppSessionCard } from "@/components/admin/whatsapp-session";
import { StatusDot } from "@/components/ui/status-badge";
import { useAdminData } from "@/components/admin/admin-data";
import { labelRole } from "@/lib/admin";

function HealthRow({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
      <StatusDot tone={ready ? "ok" : "warn"} label={ready ? "Configured" : "Action required"} />
    </li>
  );
}
export default function AdminSettingsPage() {
  const { adminUsers, whatsappSession, systemHealth } = useAdminData();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Settings"
        description="Live configuration status for access, email delivery, scheduled jobs and WhatsApp. No secrets are shown."
      />

      <Surface title="Integration health">
        <ul className="text-sm">
          <HealthRow
            label="Supabase database"
            ready={systemHealth.databaseConfigured}
            detail="Public client and server-side service credentials"
          />
          <HealthRow
            label="Resend email sender"
            ready={systemHealth.emailConfigured && systemHealth.emailCustomDomain}
            detail={systemHealth.sender || "RESEND_API_KEY and RESEND_FROM are missing"}
          />
          <HealthRow
            label="Resend delivery webhook"
            ready={systemHealth.emailWebhookConfigured}
            detail="Required for delivered, bounced, complained and failed status updates"
          />
          <HealthRow
            label="Notification scheduler"
            ready={systemHealth.cronConfigured}
            detail="CRON_SECRET is required; the hosting scheduler must call /api/cron/notifications"
          />
          <HealthRow
            label="OpenWA WhatsApp"
            ready={systemHealth.whatsAppConfigured}
            detail="OPENWA_BASE_URL and OPENWA_API_KEY"
          />
          <HealthRow
            label="Public application URL"
            ready={Boolean(systemHealth.appUrl)}
            detail={systemHealth.appUrl || "NEXT_PUBLIC_APP_URL or APP_URL is missing"}
          />
        </ul>
        {systemHealth.configurationIssues.length ? (
          <div className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Configuration actions required</p>
            <ul className="mt-2 grid gap-2">
              {systemHealth.configurationIssues.map((issue) => (
                <li key={issue.label}><span className="font-semibold">{issue.label}:</span> {issue.detail}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-emerald-700">All required production configuration checks are passing.</p>
        )}
      </Surface>

      <Surface title="Users and roles">
        {adminUsers.length ? (
          <ul className="grid gap-3">
            {adminUsers.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold text-ink">{user.name}</p>
                  <p className="text-muted">{user.email}</p>
                </div>
                <p className="text-muted">{labelRole(user.role)} / {user.status}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No admin users were returned by the database.</p>}
      </Surface>

      <Surface title="Account security">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted">Set or update your password for direct admin sign-in.</p>
          <a href="/admin/set-password" className="inline-flex h-9 items-center bg-ink px-4 text-xs font-semibold text-white">
            Set new password
          </a>
        </div>
      </Surface>

      {whatsappSession ? (
        <Surface title="OpenWA session">
          <WhatsAppSessionCard session={whatsappSession} status={whatsappSession.status} />
        </Surface>
      ) : null}
    </div>
  );
}
