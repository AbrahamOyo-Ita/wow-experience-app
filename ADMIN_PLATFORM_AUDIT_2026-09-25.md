# WOW Experience Admin Platform Audit

Audit date: 2026-09-25  
Scope: public site, admin access, Supabase data paths, notification queue, Resend integration, WhatsApp integration, automations, and analytics.

## Executive result

The application builds successfully with Next.js 16.3.4 and TypeScript. The code now contains production paths for first-party traffic analytics, admin-role enforcement, Resend delivery webhooks, stale notification recovery, and scheduled reminder automations.

This audit cannot certify the live production environment as “100% working” yet because the production Supabase project is not linked from this workspace, the Supabase hostname was not resolvable from the audit environment, and the hosting/Resend control panels were not available. The latest database migration must be applied in production and the external integrations below must be configured and tested with a real recipient before launch is considered complete.

## Changes implemented

### Admin access and data safety

- Admin layouts now require a Supabase session and a profile role whenever Supabase is configured; the previous opt-in `REQUIRE_ADMIN_AUTH=true` gate was unsafe because it was absent from the environment.
- Direct admin bundle calls no longer fall back to demo records when production Supabase is configured and the session is missing.
- Admin bundle errors are surfaced in the console instead of silently rendering mock-looking data.
- The Settings page reports actual server-side configuration state and no longer labels integrations as “Verified (mock)” or “Not wired (frontend mock)”.

### Analytics

- Added `/api/analytics/track`, using secure first-party visitor/session cookies and no stored raw IP address.
- Captures page views, referrer host, UTM source/medium/campaign, device category, and hosting-provided country/region/city headers.
- Ignores admin/API paths, common bots, and browser Do Not Track requests.
- Added `analytics_events` with RLS enabled and no anonymous/authenticated table access; only the service role can insert events.
- Added an admin-only aggregate RPC and a dashboard with 7/30/90/365-day ranges, unique visitors, sessions, page views, live visitors, bounce rate, daily trend, top pages, countries, cities, sources, referrers, and devices.
- Updated the public privacy page to disclose this first-party analytics processing.

Analytics history begins when this release and migration are deployed. Historical visits cannot be reconstructed from this repository.

### Email and notification reliability

- Resend message IDs are saved on notifications and attempts.
- Added signature-verified `/api/webhooks/resend` handling for sent, delivered, failed, bounced, complained, and suppressed events.
- Added webhook idempotency storage so Resend retries do not double-apply state.
- Campaign delivered counts now reflect actual delivered events rather than simply copying accepted/sent counts.
- Notification workers claim queued rows atomically, mark processing start time, and return interrupted jobs to the queue after 15 minutes.
- Added persistent processing metadata and provider-event indexes.
- Added real scheduled automation processing for two-day reminders, event-day reminders, and post-event thank-you messages. It respects channel consent and deduplicates each recipient/rule/channel.

### Verification completed

- `npm run build`: passed.
- `npm run lint`: passed with one pre-existing warning in `src/components/flyer/flyer-generator.tsx` (`setTheme` is assigned but unused); no lint errors.
- Next route output includes the analytics tracking route, Resend webhook route, cron route, and dynamic admin analytics/settings routes.
- Supabase production migration/advisor checks could not be run because this checkout is not linked to a Supabase project.

## Findings that still require production action

### Existing admin areas that are still presentation-only

The audit also found existing UI paths that are deliberately marked as mock or browser-only and were outside the notification/analytics hardening above:

- Admin Flyer publish/unpublish stores the current upload in the browser rather than Supabase Storage or a durable asset pipeline.
- Admin Content article, FAQ, and gallery-album edits show “saved (mock)” and are not persisted to production tables.
- The Events drawer still describes its save flow as mock; verify the deployed database write before treating event editing as authoritative.
- Audience CSV export is generated in the browser and is not server-audited.
- The WhatsApp screen’s QR is a placeholder until a real provider session is connected.

If the operating team needs these areas for production operations, provide approval for a second implementation pass covering durable content tables/storage, audited exports, and a real WhatsApp session lifecycle. They should not be represented to staff as fully live until that pass is complete.

### Resend

The local Resend key was accepted by the API but is restricted to sending email; domain listing returned an authorization error. The configured sender is on `resend.dev`, not a verified WOW Experience domain. This is not a reliable production sender identity for a public campaign.

Provide and configure:

1. A verified sending domain, ideally `wowexperience.com.ng` or a dedicated mail subdomain.
2. `RESEND_FROM`, for example `WOW Experience <updates@wowexperience.com.ng>`.
3. A Resend webhook at `https://www.wowexperience.com.ng/api/webhooks/resend` subscribed to email delivery events.
4. The generated webhook signing secret as `RESEND_WEBHOOK_SECRET`.

### WhatsApp

WhatsApp is not production-ready in the current environment because `OPENWA_BASE_URL` and `OPENWA_API_KEY` are missing. The code intentionally skips WhatsApp when those credentials are absent and can only fall back to email when a valid email address and consent exist.

Provide either:

- the persistent OpenWA host URL, API key, session identifier, and the number/session owner; or
- approval to replace OpenWA with an official WhatsApp Business provider and its credentials/templates.

Do not send a live test until you explicitly authorize the recipient number.

### Supabase

Apply `supabase/migrations/20260924120000_platform_analytics_notifications_hardening.sql` to the production project. The migration adds analytics, provider webhook idempotency, notification provider IDs, processing recovery, and automation deduplication.

The repository currently has no linked project reference, and the audit environment could not resolve the configured Supabase hostname. Provide the Supabase project ref and authorize one of:

- linking this checkout with Supabase CLI and applying the migration; or
- applying the migration in the Supabase SQL editor and returning the result.

After applying it, verify RLS and run the Supabase database advisors in the project dashboard/CLI.

### Scheduler / hosting

The worker endpoint is `/api/cron/notifications` and requires `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set. The repository does not contain proof that the current hosting provider invokes this route on a schedule.

Provide the hosting provider/project access or configure a scheduler to call it every minute (or at least every five minutes) with the production `CRON_SECRET`. Confirm one queued email moves through queued → processing → sent and then delivered after the Resend webhook.

### Admin accounts

Provide the final list of administrator email addresses. Add only those addresses to `SUPER_ADMIN_EMAILS`, then sign in once with each account so the role bootstrap can create/confirm its profile role.

### Privacy and retention approval

Approve the analytics disclosure and the retention period for analytics records. The implementation records approximate hosting-provided geography, not raw IP addresses, but the organization should still confirm that this processing and retention are acceptable for its privacy policy.

## Recommended production acceptance test

1. Apply the migration and deploy this release.
2. Open the public site in a normal browser and confirm one page view appears in Admin → Analytics; navigate to two more pages and confirm the session/page-view counts change.
3. Open the site with a UTM URL and confirm source/campaign attribution.
4. Submit a test RSVP using explicit email consent and confirm the notification queue, Resend accepted ID, webhook delivery update, and campaign counters.
5. Run the cron endpoint manually with the secret and confirm no stale processing rows remain.
6. Enable a two-day reminder in a staging/test edition, run the worker, and confirm one notification per recipient/channel (re-running must not duplicate it).
7. Test an unauthorized authenticated user and confirm `/admin` redirects with `forbidden` and no admin bundle data is returned.
8. Test a non-admin request to `/api/webhooks/resend` and confirm invalid signatures are rejected.
9. Test WhatsApp only after OpenWA/provider credentials and a consented test number are supplied.

## Files to review

- `src/app/admin/(console)/analytics/page.tsx`
- `src/app/api/analytics/track/route.ts`
- `src/app/api/webhooks/resend/route.ts`
- `src/lib/notifications/process.ts`
- `src/lib/notifications/providers.ts`
- `src/actions/analytics.ts`
- `supabase/migrations/20260924120000_platform_analytics_notifications_hardening.sql`
- `src/app/(site)/privacy/page.tsx`
