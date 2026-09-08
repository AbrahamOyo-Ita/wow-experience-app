# WOW Experience Work Log

This file keeps a short running summary of fixes and verification notes so you do not need to scroll through the terminal history.

## 2026 Event Details Updated

- Set the 2026 event date to Sunday, October 18, 2026.
- Kept the existing schedule times:
  - Doors: 8:00 AM WAT
  - Start: 9:00 AM WAT
  - End: 2:00 PM WAT
- Set the venue to Sanctified Mount Zion Church.
- Set the address to #25 Ibiono Street, Uyo, Akwa Ibom State.
- Updated public-facing location copy from Lagos to Uyo where it affected the 2026 event.
- Updated frontend fallback data in `src/data/editions.ts`.
- Updated schedule dates in `src/data/ministers.ts`.
- Updated FAQ venue copy in `src/data/faqs.ts`.
- Updated contact page venue text in `src/app/(site)/contact/page.tsx`.
- Updated about page Uyo references in `src/app/(site)/about/page.tsx`.

## Supabase Event Migration Added

- Added `supabase/migrations/20260910120000_update_2026_event_details.sql`.
- Purpose: update the live Supabase 2026 event row for databases where the old seed migration had already run.
- Verified live Supabase now returns:
  - Date: 2026-10-18
  - Venue: Sanctified Mount Zion Church
  - Address: #25 Ibiono Street, Uyo, Akwa Ibom State
  - City: Uyo
  - `is_date_placeholder=false`
  - `is_venue_placeholder=false`

## Environment / Secret Cleanup

- Confirmed `SUPABASE_SERVICE_ROLE_KEY` exists in `.env.local`.
- Blank `SUPABASE_SERVICE_ROLE_KEY` in `.env.example`.
- Important: `.env.example` must not contain real secret values.
- Because the real service role key was previously visible in `.env.example`, rotate it in Supabase if the file was committed or shared.

## Admin Access Hardening

- Updated `src/actions/auth.ts`.
- After password login, the app now checks `profile_roles`.
- Users without an admin role are signed out and redirected with the forbidden admin message.
- Admin login page:
  - `http://localhost:3000/admin/login`
- Admin dashboard:
  - `http://localhost:3000/admin`
- To make a Supabase Auth user an admin:

```sql
insert into public.profile_roles (profile_id, role)
select id, 'super_admin'
from auth.users
where email = 'YOUR_EMAIL_HERE'
on conflict (profile_id, role) do nothing;
```

## QR Attendance Testing

- Live `preview_check_in` is enabled for the 2026 event.
- This means public check-in can be tested before the real event day.
- Test URL:
  - `http://localhost:3000/attend/2026`
- Production QR target should point to:
  - `https://your-production-domain.com/attend/2026`
- Expected successful result:
  - `You are checked in`
- Submitting the same person/contact again should show:
  - `Already recorded`
- Development-only mock state URLs:
  - `http://localhost:3000/attend/2026?mockState=success`
  - `http://localhost:3000/attend/2026?mockState=duplicate`
  - `http://localhost:3000/attend/2026?mockState=outside_window`
  - `http://localhost:3000/attend/2026?mockState=failure`

## Backend Verification

- Verified the live Supabase 2026 event row through the REST API.
- Verified these backend tables are reachable:
  - `profiles`
  - `profile_roles`
  - `contacts`
  - `rsvps`
  - `attendance_records`
  - `volunteer_applications`
  - `campaigns`
  - `notifications`
  - `whatsapp_sessions`
  - `event_editions`
- Verified these RPC functions are callable:
  - `submit_rsvp`
  - `submit_volunteer`
  - `check_in_attendance`
  - `submit_enquiry`
  - `unsubscribe_contact`

## Build Verification

- `npm run lint` passed.
- `npm run build` passed.

## Localhost Connection Fix

- Browser showed `ERR_CONNECTION_REFUSED` for `localhost`.
- Cause: no app server was listening on port `3000`.
- Started the local dev server with `npm run dev`.
- Verified these URLs return `200 OK`:
  - `http://localhost:3000`
  - `http://localhost:3000/attend/2026`
  - `http://localhost:3000/admin/login`
- Current local dev URL:
  - `http://localhost:3000`
- Current network URL shown by Next.js:
  - `http://192.168.137.1:3000`

## Remaining Production Items

- Connect Resend for email sending.
- Connect OpenWA for WhatsApp sending.
- Configure production hosting environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `APP_URL`
  - `CRON_SECRET`
  - `RESEND_API_KEY`
  - `RESEND_FROM`
  - `OPENWA_BASE_URL`
  - `OPENWA_API_KEY`
- Configure the production cron job for `/api/cron/notifications`.
- Run real end-to-end tests:
  - RSVP
  - volunteer application
  - QR attendance
  - enquiry
  - unsubscribe
  - admin login
  - campaign scheduling
  - notification queue processing
- Run Supabase advisors/lint on the linked project.
