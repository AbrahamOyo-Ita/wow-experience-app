# WOW Experience Work Log

This file keeps a short running summary of fixes and verification notes so you do not need to scroll through the terminal history.

## Our First Chapter 2022 (WOW Experience 1.0) Update

- **Section Rebrand on `/about`**: Updated the historical impact section to highlight the genuine origin of the movement: **OUR FIRST CHAPTER • 2022 (WOW EXPERIENCE 1.0)**.
- **Narrative Copy Updated**:
  - Title: `WOW EXPERIENCE 1.0`
  - Story: *"We gathered with one desire, to lift Jesus louder than everything competing for our hearts. What happened in that room became more than our first edition. It became the heartbeat of WOW Experience."*
  - Key Pillars:
    - *A room filled with young hearts hungry for God.*
    - *Worship, prayer and moments that drew us closer to Jesus.*
    - *The first chapter of a story we’re still living in today.*
- **Data & Navigation**: Updated `previousImpact` in `src/data/content.ts` and updated the photo gallery CTA link and badge in `src/app/(site)/about/page.tsx`.


## QR Code Live Domain Fix (wowexperience.com.ng)

- **Root Cause**: The QR code destination URL resolver defaulted to `https://wow-experience-app.vercel.app`, causing scanned attendance QR codes to open the Vercel deployment link rather than the official production domain.
- **Fix Applied**:
  - Updated `src/components/admin/attendance-qr.tsx` to strictly target the live domain `https://www.wowexperience.com.ng`, ignoring any `vercel.app` or `localhost` fallbacks.
  - Updated `src/lib/app-origin.ts` `PRODUCTION_FALLBACK` to `https://www.wowexperience.com.ng` and bypassed `vercel.app` in production.
  - Synchronized `src/app/layout.tsx`, `src/actions/auth.ts`, `src/components/polo/polo-details.tsx`, `.env.local`, `.env.example`, and `README.md` to use `https://www.wowexperience.com.ng`.
- **Verification**: Confirmed `npm test` (8/8 pass), `npm run lint` (0 errors), and `npm run build` (38/38 routes compiled).


## Branded Door Attendance QR Code with Integrated Logo

- **Level H Redundancy (30%)**: Upgraded QR code generation in `src/components/admin/attendance-qr.tsx` to Reed-Solomon Error Correction Level `H`, enabling safe embedding of a central brand mark without reducing scanability.
- **Embedded WOW Experience Logo**:
  - Implemented automatic Base64 encoding and SVG injection of `/images/wow-logo-black.webp` with a rounded protective white centerpiece badge (`rx` corner rounding and subtle border).
  - Centered badge is sized precisely at 24% of the QR matrix width, staying well within the 30% redundancy threshold and keeping all 3 corner finder patterns completely clear.
- **Print & Design Exports**:
  - Added **Download SVG**: High-resolution vector file with fully embedded standalone base64 logo.
  - Added **Download PNG (1600×1600px)**: Offscreen HTML5 canvas rasterization providing ultra-crisp print-ready files for physical roll-ups, check-in desks, badges, and social graphics.
- **Interactive UI**:
  - Added an interactive toggle between *"Branded with WOW Logo (Active)"* and *"Plain QR Matrix"*.
  - Added a status indicator confirming `Level H · 30% Redundancy`.
- **Verification**: Confirmed `npm test` (8/8 pass), `npm run lint` (0 errors), and `npm run build` (38/38 routes compiled).


## What We're All About - Core Pillars Update

- **Section Rebrand**: Transformed the "What We Refuse to Compromise" section on `/about` into **"WHAT WE’RE ALL ABOUT"**.
- **6 Core Pillars**: Added the 6 newly defined core pillars in `src/data/content.ts`:
  1. *CHRIST, ALWAYS AT THE CENTER*
  2. *WORSHIP BEYOND PERFORMANCE*
  3. *ONE ROOM. ONE HEART.*
  4. *EXCELLENCE WITH PURPOSE*
  5. *PEOPLE BEFORE NUMBERS*
  6. *WE LEAVE CHANGED*
- **Visual & Layout Enhancements**:
  - Upgraded the card grid from 2-column to a balanced 3-column responsive layout (`md:grid-cols-2 lg:grid-cols-3`).
  - Added clean mono-styled numbering indices (`01` through `06`) to guide attendees through each pillar.
  - Updated the hero section anchor CTA button label to `"What we’re all about"`.
- **Verification**: Confirmed `npm test` (8/8 pass), `npm run lint` (0 errors), and `npm run build` (38/38 routes compiled).


## Attending Flyer Viral Sharing & Invitation Link

- **Enriched Share Message & Link**: Updated the flyer generator share workflow in `src/components/flyer/flyer-generator.tsx` from generic `"I'm attending!"` to an engaging, descriptive invitation message with direct call-to-action:
  - Text: *"I'm attending Wonders of Worship Experience 2026! 🔥 Join me for an extraordinary encounter in worship. Create your own personalized attending flyer here: [link]"*
  - Direct Link: Automatically resolves to `/flyer` (e.g. `https://www.wowexperience.com.ng/flyer`).
- **Comprehensive Share Integration**:
  - Integrated with `navigator.share` so mobile device share sheets (WhatsApp, Instagram, Twitter, iMessage, etc.) send the generated high-resolution PNG image alongside the descriptive caption and clickable link.
  - Built a luxury **Share & Invite Modal** featuring:
    - 1-click **Copy Caption & Link** button with instant visual clipboard feedback.
    - Direct **Share to WhatsApp** with markdown styling.
    - Direct **Share on X / Twitter** with relevant event hashtags (`#WOWExperience2026`).
    - Direct **Copy Flyer Page Link** input and button.
  - Added an inline quick-share caption preview in the flyer editor sidebar for immediate copy access.
- **Verification**: Confirmed `npm test` (8/8 pass), `npm run lint` (0 errors), and `npm run build` (38/38 routes compiled).

## Volunteer Approval Email Automation

- **Bug Spot & Fix**: Spotted that `updateVolunteerStatusAction` and `batchUpdateVolunteerStatusAction` in `src/actions/admin.ts` updated `volunteer_applications.status` in the database, but lacked any email dispatch mechanism, leaving applicants without confirmation emails upon approval.
- **Transactional Email Dispatch**:
  - Implemented `renderVolunteerStatusUpdateEmail` in `src/lib/notifications/email-template.ts` adhering to the brand design system for `accepted`, `waitlisted`, and `declined` states.
  - Implemented `sendVolunteerStatusEmail` in `src/actions/admin.ts` to automatically send styled emails via `sendEmail` (Resend) upon individual or batch approval.
  - Added audit logging to `public.notifications` and `public.notification_attempts` with provider metadata.
- **UI & Toast Feedback**:
  - Enhanced `/admin/volunteers` toast notifications to display real-time confirmation containing recipient email address (e.g. *"Application accepted and confirmation email sent to ...'*).
  - Added automated email delivery status card and updated application decision copy in the admin volunteer details drawer.
- **Test & Build Verification**:
  - Added unit test suite `tests/volunteer-email.test.ts` covering all status email templates (8/8 tests passing).
  - Confirmed `npm run lint` and `npm run build` pass cleanly with zero errors.

## 2026 Event Details Updated

- Set the 2026 event date to Sunday, October 18, 2026.
- Updated schedule times:
  - Doors: 4:00 PM WAT
  - Start: 5:00 PM WAT
  - End: 10:00 PM WAT
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

## Attending Flyer Editor Migration & Seed Applied

- Pushed migration `20260928090000_attending_flyer_editor.sql` to remote Supabase via `supabase db push`.
- Added required columns `base_width`, `base_height`, `config_version`, and `config` to `public.flyer_templates`.
- Added constraints `flyer_templates_dimensions_check` and `flyer_templates_config_check`.
- Configured RLS policies for `super_admin` on `public.flyer_templates` and `storage.objects` (`flyer-templates` bucket).
- Ran `npm run seed:attending-flyer` to seed the active template and upload artwork to Supabase Storage.
- Verified PostgREST schema cache recognizes `base_height`, resolving the "Could not find 'base_height' column in schema cache" error.

## Volunteers Admin Dynamic Review & Approval Overhaul

- Upgraded `src/app/admin/(console)/volunteers/page.tsx` into a fully interactive review & triage hub:
  - Added dedicated **Actions** column with "Review" button, quick 1-click **Accept** and **Decline** triggers.
  - Enabled row-click navigation to open the detailed application drawer.
  - Added multi-select batch actions toolbar (Accept, Mark Under Review, Waitlist, Decline selected applicants) in `DataTable`.
  - Added interactive metric cards that filter the table by pipeline stage with clear active filters.
  - Built comprehensive application review drawer displaying full contact details (email with copy, phone with direct WhatsApp link), occupation, location, and full candidate responses (experience, availability, motivation).
  - Added color-coded status decision workflow buttons (Accept, Under Review, Waitlist, Decline) with optimistic updates and toast feedback.
  - Added WhatsApp onboarding card with customized text interpolation, copy-to-clipboard, and one-tap "Open in WhatsApp With Note" link.
- Implemented `batchUpdateVolunteerStatusAction` in `src/actions/admin.ts` and wired through `VolunteerService`.

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
