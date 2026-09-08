# Wonders of Worship Experience

Production-grade event platform for Wonders of Worship Experience. The application serves the public event website, RSVP capture, volunteer intake, QR attendance, admin operations, campaign management, and consent-based notifications.

Built with Next.js App Router, Supabase, Resend, and a restrained editorial interface inspired by Celebration Church International: white canvas, bold typography, deep red accents, and photography-led storytelling.

## Table Of Contents

- [Platform Scope](#platform-scope)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Admin Login](#admin-login)
- [Admin Authorization Model](#admin-authorization-model)
- [Public Experience](#public-experience)
- [Admin Console](#admin-console)
- [Data And Services](#data-and-services)
- [Notifications](#notifications)
- [Supabase](#supabase)
- [Quality Checks](#quality-checks)
- [Deployment Checklist](#deployment-checklist)
- [Troubleshooting](#troubleshooting)

## Platform Scope

The platform supports:

- Public event discovery for 2025, 2026, and 2027 editions.
- RSVP capture with channel-specific consent.
- Volunteer applications with team preference and consent records.
- QR attendance check-in for event-day operations.
- Admin console for audience, RSVPs, attendance, campaigns, templates, automations, content, analytics, settings, and audit logs.
- Email notifications through Resend.
- WhatsApp integration hooks through OpenWA-compatible endpoints.
- Supabase-backed live data with mock fallback data for local development.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js `16.3.4` App Router |
| Runtime | React `19.2.8`, TypeScript |
| Styling | Tailwind CSS v4, local design tokens |
| UI | Radix UI, lucide-react, shadcn-compatible primitives |
| Database/Auth | Supabase Auth, Postgres, RLS policies, RPC functions |
| Email | Resend SDK |
| Validation | Zod |
| Motion | motion |

## Quick Start

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and fill in the values required for the flows you want to test.

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build production output:

```bash
npm run build
```

Run production locally:

```bash
npm start
```

## Environment Variables

`.env.local` must stay local. Do not commit real secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes for live data | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes for live data | Browser-safe Supabase key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional fallback | Legacy/public Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for admin repairs, cron, privileged reads | Server-only Supabase service role key |
| `SUPER_ADMIN_EMAILS` | Yes for owner access | Comma-separated owner emails that should self-heal to `super_admin` |
| `RESEND_API_KEY` | Yes for email | Resend API key |
| `RESEND_FROM` | Yes for email | Sender address, currently `wowexperience7@gmail.com` |
| `OPENWA_BASE_URL` | Optional | WhatsApp provider endpoint |
| `OPENWA_API_KEY` | Optional | WhatsApp provider API key |
| `APP_URL` | Yes for auth redirects | Public app URL, for local use `http://localhost:3000` |
| `CRON_SECRET` | Yes for cron | Protects notification cron endpoint |

Current owner default:

```env
SUPER_ADMIN_EMAILS=oyoitaabraham@gmail.com
```

## Admin Login

Use this runbook to access the admin dashboard.

### 1. Confirm Environment

Your `.env.local` should include:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPER_ADMIN_EMAILS=oyoitaabraham@gmail.com
APP_URL=http://localhost:3000
```

For deployed environments, set `APP_URL` to the deployed domain.

### 2. Start Or Restart The App

If you changed `.env.local`, restart the dev server:

```bash
npm run dev
```

Environment variables are loaded at server start.

### 3. Open The Login Page

Go to:

```text
http://localhost:3000/admin/login
```

For production, use:

```text
https://your-domain.com/admin/login
```

### 4. Sign In

Use:

```text
oyoitaabraham@gmail.com
```

You can sign in using either:

- Password login, if the Supabase Auth user has a password.
- Magic link, if SMTP/auth email delivery is configured in Supabase.

### 5. Access The Dashboard

After successful authentication, the app checks `public.profile_roles`. The owner email is also repaired automatically through `SUPER_ADMIN_EMAILS`, so `oyoitaabraham@gmail.com` should have:

```text
super_admin
```

Dashboard:

```text
/admin
```

### 6. If You Still Cannot Enter

Do these in order:

1. Log out, then log in again.
2. Restart the dev server after changing `.env.local`.
3. Confirm you are using `oyoitaabraham@gmail.com`, not another account.
4. Confirm `SUPABASE_SERVICE_ROLE_KEY` is present in the environment where the app is running.
5. Clear browser cookies for the local/deployed domain and retry.
6. Check that `APP_URL` matches the environment you are using.

## Admin Authorization Model

Admin access is role-based.

Tables:

- `public.profiles`
- `public.profile_roles`

Supported roles:

- `super_admin`
- `event_admin`
- `communications_manager`
- `content_editor`

The admin dashboard guard requires an authenticated Supabase user with at least one row in `profile_roles`.

Owner self-healing is implemented in:

- `src/lib/supabase/admin-access.ts`
- `src/actions/auth.ts`
- `src/app/auth/callback/route.ts`
- `src/app/admin/(console)/layout.tsx`

This ensures configured owner emails are granted `super_admin` when they authenticate.

## Public Experience

| Route | Purpose |
| --- | --- |
| `/` | Event home |
| `/about` | Purpose, story, team |
| `/experience/2026` | Current edition |
| `/experience/2026/ministers` | Minister profiles |
| `/experience/2026/faq` | Practical questions |
| `/volunteer` | Volunteer application |
| `/insights` | Article index |
| `/insights/[slug]` | Article detail |
| `/gallery` | Edition albums |
| `/contact` | Enquiry form |
| `/attend/2026` | QR attendance check-in |
| `/experiences` | Edition archive |
| `/privacy` | Privacy notice |
| `/terms` | Terms |
| `/unsubscribe` | Channel opt-out |

The RSVP modal appears after 3 seconds or 25% scroll, except on admin, attendance, privacy, terms, and unsubscribe routes. Dismissal is stored for 7 days. Successful RSVP suppresses the modal for the active edition.

## Admin Console

| Route | Purpose |
| --- | --- |
| `/admin` | Operational overview |
| `/admin/events` | Event configuration |
| `/admin/audience` | Contacts and consent |
| `/admin/rsvps` | RSVP pipeline |
| `/admin/attendance` | Check-in and attendance records |
| `/admin/volunteers` | Volunteer applications |
| `/admin/campaigns` | Campaign creation and testing |
| `/admin/templates` | Message templates |
| `/admin/automations` | Reminder automation controls |
| `/admin/content` | Content management surfaces |
| `/admin/analytics` | Operational analytics |
| `/admin/settings` | Users, sender identity, WhatsApp session |
| `/admin/audit` | Audit log |

Admin edition selection is stored in:

```text
localStorage key: wow_admin_edition
```

## Data And Services

Important directories:

| Path | Purpose |
| --- | --- |
| `src/app` | App Router pages, layouts, route handlers |
| `src/actions` | Server actions for auth, admin, public submissions |
| `src/components` | Public and admin UI components |
| `src/data` | Mock/fallback content and operations data |
| `src/lib` | Supabase clients, notifications, admin utilities |
| `src/services` | Service contracts, mock service, live service facade |
| `supabase/migrations` | Schema, functions, policies, seed data |

Key service files:

- `src/services/contracts.ts`
- `src/services/mock.ts`
- `src/services/live.ts`
- `src/services/index.ts`

Mock attendance states:

```text
/attend/2026?mockState=success
/attend/2026?mockState=duplicate
/attend/2026?mockState=outside_window
/attend/2026?mockState=offline
/attend/2026?mockState=failure
```

## Notifications

Email is sent through Resend.

Provider:

```text
src/lib/notifications/providers.ts
```

Required variables:

```env
RESEND_API_KEY=...
RESEND_FROM=wowexperience7@gmail.com
```

Important Resend note: the sender address must be allowed by Resend. If `wowexperience7@gmail.com` is not verified or permitted by the Resend account/domain setup, the code can be correct while delivery still fails.

Notification queue processing:

```text
src/lib/notifications/process.ts
src/app/api/cron/notifications/route.ts
```

## Supabase

Migrations live in:

```text
supabase/migrations
```

The database includes:

- Profiles and roles.
- Event editions and volunteer teams.
- Contacts, consents, RSVPs, declines.
- Attendance records.
- Volunteer applications and enquiries.
- Message templates, campaigns, automations.
- Notification attempts and audit logs.

RLS is enabled across public tables. Admin reads and writes are controlled through `profile_roles` and helper functions in the `app_private` schema.

## Quality Checks

Run before shipping:

```bash
npm run lint
npm run build
```

Expected result:

- ESLint exits cleanly.
- Next.js production build completes.
- TypeScript passes during build.

## Deployment Checklist

Before production use:

- Apply Supabase migrations to the target project.
- Configure all required hosting environment variables.
- Confirm `SUPER_ADMIN_EMAILS` includes the owner account.
- Confirm Supabase Auth redirect URLs include the deployed domain.
- Confirm `APP_URL` matches the deployed domain.
- Confirm Resend sender identity is valid.
- Configure notification cron with `CRON_SECRET`.
- Test RSVP, volunteer application, enquiry, unsubscribe, QR check-in, admin login, campaign test send, and notification processing.

## Troubleshooting

### Admin Login Redirects To Forbidden

Likely causes:

- User is authenticated but has no `profile_roles` row.
- The wrong email was used.
- `SUPER_ADMIN_EMAILS` is missing in the running environment.
- `SUPABASE_SERVICE_ROLE_KEY` is missing, so owner self-healing cannot run.
- Browser still has a stale session cookie.

Fix:

1. Set `SUPER_ADMIN_EMAILS=oyoitaabraham@gmail.com`.
2. Set `SUPABASE_SERVICE_ROLE_KEY`.
3. Restart the app.
4. Clear cookies.
5. Log in again.

### Magic Link Does Not Arrive

Check:

- Supabase Auth email settings.
- SMTP provider configuration.
- `APP_URL`.
- Supabase redirect URL allowlist.
- Spam/promotions folder.

### Email Sends Fail

Check:

- `RESEND_API_KEY`.
- `RESEND_FROM`.
- Resend sender/domain verification.
- Resend account logs.

### Supabase Data Does Not Load

Check:

- `NEXT_PUBLIC_SUPABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Applied migrations.
- RLS policies.
- Browser console and server logs.

