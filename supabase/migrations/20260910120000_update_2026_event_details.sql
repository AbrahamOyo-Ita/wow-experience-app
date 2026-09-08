update public.event_editions
set
  starts_at = '2026-10-18T09:00:00+01:00',
  ends_at = '2026-10-18T14:00:00+01:00',
  doors_at = '2026-10-18T08:00:00+01:00',
  venue_name = 'Sanctified Mount Zion Church',
  venue_address = '#25 Ibiono Street, Uyo, Akwa Ibom State',
  venue_city = 'Uyo',
  venue_country = 'Nigeria',
  directions_url = 'https://maps.google.com/?q=Sanctified+Mount+Zion+Church+25+Ibiono+Street+Uyo+Akwa+Ibom+State',
  venue_notes = 'Final venue details will be sent to everyone who RSVPs.',
  attendance_window_starts_at = '2026-10-18T07:00:00+01:00',
  attendance_window_ends_at = '2026-10-18T16:00:00+01:00',
  is_date_placeholder = false,
  is_venue_placeholder = false
where legacy_key = 'edition-2026'
   or slug = '2026'
   or year = 2026;
