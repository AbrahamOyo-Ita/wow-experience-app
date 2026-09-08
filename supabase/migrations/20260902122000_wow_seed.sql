insert into public.event_editions (
  id, year, legacy_key, slug, name, short_name, theme, statement, description,
  timezone, starts_at, ends_at, doors_at,
  venue_name, venue_address, venue_city, venue_country, directions_url, venue_notes,
  status, published_at, gallery_drive_url, attendance_url,
  attendance_window_starts_at, attendance_window_ends_at, preview_check_in,
  reminder_two_day_enabled, reminder_event_day_enabled, reminder_event_day_time,
  qr_target_url, is_date_placeholder, is_venue_placeholder
) values
(
  '2c026000-0000-4000-8000-000000000026',
  2026, 'edition-2026', '2026',
  'Wonders of Worship Experience 2026', 'WOW 2026',
  'A people in wonder',
  'One gathering. One people. One sound of worship.',
  'Wonders of Worship Experience 2026 is a focused gathering for people who want to worship Christ with clarity, reverence and joy. The day is built around Scripture, congregational singing and a quiet invitation to serve.',
  'Africa/Lagos',
  '2026-10-18T09:00:00+01:00',
  '2026-10-18T14:00:00+01:00',
  '2026-10-18T08:00:00+01:00',
  'Sanctified Mount Zion Church',
  '#25 Ibiono Street, Uyo, Akwa Ibom State',
  'Uyo', 'Nigeria',
  'https://maps.google.com/?q=Sanctified+Mount+Zion+Church+25+Ibiono+Street+Uyo+Akwa+Ibom+State',
  'Final venue details will be sent to everyone who RSVPs.',
  'published',
  '2026-06-01T10:00:00+01:00',
  'https://drive.google.com',
  '/attend/2026',
  '2026-10-18T07:00:00+01:00',
  '2026-10-18T16:00:00+01:00',
  true,
  true, true, '07:00',
  '/attend/2026',
  false, false
),
(
  '2c025000-0000-4000-8000-000000000025',
  2025, 'edition-2025', '2025',
  'Wonders of Worship Experience 2025', 'WOW 2025',
  'Behold Him',
  'A first gathering around the worth of Christ.',
  'The 2025 edition introduced the annual rhythm: a simple room, a prepared people, and a day given to worship.',
  'Africa/Lagos',
  '2025-11-08T09:00:00+01:00',
  '2025-11-08T13:30:00+01:00',
  '2025-11-08T08:00:00+01:00',
  'The Hall, Ikeja',
  'Ikeja, Lagos',
  'Lagos', 'Nigeria',
  'https://maps.google.com/?q=Ikeja+Lagos',
  'Completed edition.',
  'completed',
  '2025-07-01T10:00:00+01:00',
  'https://drive.google.com',
  '/attend/2025',
  '2025-11-08T07:00:00+01:00',
  '2025-11-08T16:00:00+01:00',
  false,
  true, true, '07:00',
  '/attend/2025',
  false, false
),
(
  '2c027000-0000-4000-8000-000000000027',
  2027, 'edition-2027', '2027',
  'Wonders of Worship Experience 2027', 'WOW 2027',
  'To be announced',
  'The next annual gathering will open after 2026.',
  '2027 will reuse this same platform. Dates, ministers and venue will be published after the 2026 edition.',
  'Africa/Lagos',
  '2027-11-13T09:00:00+01:00',
  '2027-11-13T14:00:00+01:00',
  '2027-11-13T08:00:00+01:00',
  'To be announced',
  'To be announced',
  'Lagos', 'Nigeria',
  'https://maps.google.com/?q=Lagos',
  'Draft edition for platform reuse.',
  'draft',
  null,
  'https://drive.google.com',
  '/attend/2027',
  '2027-11-13T07:00:00+01:00',
  '2027-11-13T16:00:00+01:00',
  false,
  true, true, '07:00',
  '/attend/2027',
  true, true
)
on conflict (id) do nothing;

insert into public.volunteer_teams (
  edition_id, team_key, name, slug, description, expectation, capacity, status
)
select e.id, t.team_key, t.name, t.slug, t.description, t.expectation, t.capacity, 'open'
from public.event_editions e
join (
  values
    ('team-hospitality', 'Hospitality', 'hospitality', 'Meet people at the door, seat the room and keep arrival calm.', 'Arrive by 7:15 AM. Remain until the last guest is pointed toward exit flow.', 24),
    ('team-worship', 'Worship team', 'worship-team', 'Voices and instruments that serve congregational singing.', 'Attend the midweek rehearsal and be in place 75 minutes before doors.', 16),
    ('team-media', 'Media', 'media', 'Lyrics, lighting cues and a restrained photographic record.', 'Arrive for sound check. No photography during prayer unless briefed.', 8),
    ('team-prayer', 'Prayer', 'prayer', 'Intercede before the gathering and be available for ministry after the word.', 'Join the 7:30 AM prayer set. Stay through close.', 12),
    ('team-logistics', 'Logistics', 'logistics', 'Chairs, water, signage and the unglamorous work that lets the room breathe.', 'Setup from 6:30 AM. Strike after the gathering.', 18)
) as t(team_key, name, slug, description, expectation, capacity) on true
where e.year = 2026
on conflict (edition_id, team_key) do nothing;

insert into public.automation_rules (
  edition_id, name, trigger_type, offset_minutes, run_time, channel_mode, enabled, last_run_status
)
select e.id, r.name, r.trigger_type, r.offset_minutes, r.run_time, r.channel_mode, r.enabled, 'never'
from public.event_editions e
join (
  values
    ('RSVP confirmation', 'rsvp_confirmation', 0, null::text, 'both', true),
    ('Two-day reminder', 'two_day_reminder', -2880, null::text, 'both', true),
    ('Event-day reminder', 'event_day_reminder', null::integer, '07:00', 'both', true),
    ('Volunteer receipt', 'volunteer_receipt', 0, null::text, 'both', true),
    ('Volunteer acceptance', 'volunteer_acceptance', 0, null::text, 'whatsapp', true),
    ('Post-event thank you', 'post_event_thank_you', 1440, null::text, 'email', false),
    ('Email fallback', 'email_fallback', 0, null::text, 'fallback', true)
) as r(name, trigger_type, offset_minutes, run_time, channel_mode, enabled) on true
where e.year = 2026
on conflict (edition_id, trigger_type) do nothing;

insert into public.message_templates (
  edition_id, name, category, channel, subject, preview_text, body, variables, status
)
select e.id, t.name, t.category, t.channel, t.subject, t.preview_text, t.body, t.variables, 'active'
from public.event_editions e
join (
  values
    (
      'RSVP confirmation (WhatsApp)',
      'rsvp',
      'whatsapp',
      null,
      null,
      'Thank you {{first_name}}. You are counted in for {{event_name}} on {{event_date}} at {{event_time}}. Venue: {{venue}}. We will only write on the channel you approved.',
      array['first_name','event_name','event_date','event_time','venue']
    ),
    (
      'RSVP confirmation (email)',
      'rsvp',
      'email',
      'You are counted in for {{event_name}}',
      'Date, time and what to expect.',
      'Dear {{first_name}}, thank you for RSVPing to {{event_name}}. The gathering is on {{event_date}} at {{event_time}}. Venue: {{venue}}. Directions: {{directions_url}}.',
      array['first_name','event_name','event_date','event_time','venue','directions_url']
    ),
    (
      'Volunteer receipt (email)',
      'volunteer',
      'email',
      'We received your {{event_name}} volunteer application',
      'Your application is with the team.',
      'Dear {{first_name}}, thank you for offering to serve on the {{volunteer_team}} team at {{event_name}}. We will write when your application is reviewed.',
      array['first_name','volunteer_team','event_name']
    ),
    (
      'Two-day reminder (WhatsApp)',
      'reminder',
      'whatsapp',
      null,
      null,
      '{{first_name}}, {{event_name}} is in two days. {{event_date}} at {{event_time}}. Venue: {{venue}}. Reply STOP to leave reminders.',
      array['first_name','event_name','event_date','event_time','venue']
    )
) as t(name, category, channel, subject, preview_text, body, variables) on true
where e.year = 2026;

insert into public.whatsapp_sessions (
  session_key, display_name, masked_phone, provider, status, last_activity, health_note
)
values (
  'wow-primary',
  'WOW Experience reminders',
  '+234 *** *** **00',
  'openwa',
  'disconnected',
  'No OpenWA host configured.',
  'Connect a persistent OpenWA host and set OPENWA_BASE_URL before sending WhatsApp. Email fallback uses Resend when RESEND_API_KEY is present.'
)
on conflict (session_key) do nothing;
