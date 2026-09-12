# Messaging, Campaign, and Newsletter Audit Log

Date: 2026-09-11

## Root Causes Found

- Email automation was split between one-off scratch scripts and the app queue. The script sent directly to Resend with a hard-coded sender/test recipient, disabled TLS verification, and then wrote notification rows manually, so it did not exercise the production queue path.
- Email provider handling did not validate recipients, did not catch transport exceptions, and rendered HTML by inserting raw body content.
- WhatsApp automation scripts used hard-coded localhost credentials, fixed test recipients, and direct OpenWA calls outside the app queue. Session health was not reliably written back to `whatsapp_sessions`.
- Newsletter subscription in the footer was UI-only. It set local React state but had no server action, database table, duplicate handling, or subscriber consent record.
- Admin campaigns were a mock wizard. The confirm action only displayed a local banner and never called the server action, selected real recipients, persisted targets, stored attachments, or queued notifications.
- There was no admin newsletter publishing model and no public newsletter archive/reader route.
- ESLint was scanning generated OpenWA/session artifacts and scratch scripts as app source, producing noisy failures unrelated to production code.

## Fixes Shipped

- Added `newsletter_subscribers` and `newsletters` tables, public `subscribe_newsletter` RPC, campaign target/attachment columns, RLS policies, grants, triggers, and indexes in `supabase/migrations/20260911162000_newsletters_campaigns.sql`.
- Added real public newsletter subscription via `subscribeNewsletter`, with validation, rate-limited RPC persistence, duplicate prevention, and footer loading/error/success states.
- Added `/newsletters` and `/newsletters/[slug]` subscriber-facing reader pages for published newsletters.
- Added admin newsletter management inside `/admin/content`: create, edit, preview, publish, view subscribers, and queue broadcasts to subscribers on publish.
- Rebuilt `/admin/campaigns` as an operational composer with title, subject, WhatsApp/email/both channel selection, emoji insertion, attachment upload metadata, all-users/all-attendees/targeted contact selection, send-now and scheduled modes.
- Extended the notification worker to expand due campaigns into per-contact notification rows, filter by consent, queue newsletter broadcasts, process direct campaign/newsletter payloads, log attempts, and update campaign counts/status.
- Hardened Resend/OpenWA provider handling with recipient checks, exception capture, escaped HTML rendering, attachment mapping, consistent skipped/failed/sent statuses, and response previews.
- Standardized scratch triggers so email processing calls `/api/cron/notifications` and WhatsApp sends use `OPENWA_BASE_URL`/`OPENWA_API_KEY`.
- Reworked the OpenWA REST host to use env-driven session/port/auth settings, update `whatsapp_sessions`, expose health endpoints, validate requests, and rate-limit sends.
- Updated `.env.example` with OpenWA operational settings.
- Updated ESLint ignores for generated/session/scratch artifacts and cleaned remaining source lint issues.

## Verification

- `npm.cmd run lint` passes with no warnings.
- `npm.cmd run build` passes successfully on Next.js 16.3.4.

## Operational Notes

- Apply the new Supabase migration before using newsletter or enhanced campaign features in a live database.
- Scheduled delivery still depends on invoking `POST /api/cron/notifications` from a platform cron with `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set.
- Real media delivery depends on provider support: email attachments are sent through Resend; WhatsApp attachment metadata is forwarded to the OpenWA host and can be expanded there for binary file delivery.
