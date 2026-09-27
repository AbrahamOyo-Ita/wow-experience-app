-- Articles and FAQs Content Tables, Storage, and RLS

-- 1. Storage bucket for article cover images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-covers',
  'article-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "public_read_article_covers"
on storage.objects
for select
to public
using (bucket_id = 'article-covers');

create policy "admins_upload_article_covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'article-covers'
  and (select app_private.is_admin())
);

create policy "admins_delete_article_covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'article-covers'
  and (select app_private.is_admin())
);

-- 2. Articles table
create table if not exists public.articles (
  id text primary key,
  slug text unique not null,
  title text not null,
  excerpt text not null,
  body text[] not null default '{}',
  cover_image_src text not null,
  cover_image_alt text not null default '',
  author text not null,
  author_role text not null default '',
  category text not null default 'General',
  tags text[] not null default '{}',
  status text not null default 'draft',
  published_at timestamptz,
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles enable row level security;

create policy "public_read_published_articles"
on public.articles
for select
to public
using (status = 'published');

create policy "admins_all_articles"
on public.articles
for all
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

-- 3. FAQs table
create table if not exists public.faqs (
  id text primary key,
  edition_id uuid references public.event_editions(id) on delete set null,
  category text not null default 'general',
  question text not null,
  answer text not null,
  sort_order integer not null default 1,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faqs enable row level security;

create policy "public_read_published_faqs"
on public.faqs
for select
to public
using (is_published = true);

create policy "admins_all_faqs"
on public.faqs
for all
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

-- 4. Seed initial articles
insert into public.articles (
  id, slug, title, excerpt, body, cover_image_src, cover_image_alt, author, author_role, category, tags, status, published_at, seo_title, seo_description
)
values
(
  'art-posture',
  'the-posture-of-wonder',
  'The posture of wonder',
  'Wonder is not a mood we manufacture. It is what happens when a people look at Christ without rushing to the next song.',
  array[
    'Wonders of Worship Experience exists because worship can become a programme. Rooms fill, songs start, and nobody has actually looked at Jesus.',
    'Wonder is slower than production. It asks a congregation to stay with a verse, to sing a line until it is true in the mouth, and to let silence do some of the work.',
    'This is why the 2026 gathering is not built as a conference. The schedule is short on announcements and long on congregational singing. The word is brief on purpose.',
    'If you are coming, come ready to stand among a people, not in front of a show. Bring your voice. Bring patience. Leave the need to be impressed at the door.',
    'We will publish practical details as they are confirmed. The invitation itself is already clear: come and behold Him.'
  ],
  '/images/insight-posture.jpg',
  'A quiet table prepared for reflection',
  'Amara Okonkwo',
  'Worship lead',
  'Worship',
  array['worship', 'wonder', 'gathering'],
  'published',
  '2026-07-12T08:00:00+01:00',
  'The posture of wonder | Wonders of Worship Experience',
  'Why Wonders of Worship Experience 2026 is built around congregational singing, Scripture and unhurried attention to Christ.'
),
(
  'art-gather',
  'why-we-gather',
  'Why we gather',
  'A website can carry information. It cannot replace a room of people singing the same confession at the same time.',
  array[
    'The internet is useful for dates, directions and reminders. It is a poor substitute for gathered worship.',
    'We still build this site because people need a clear invitation. They need to know when to come, how to serve, and how we will treat their phone number.',
    'The gathering itself remains the point. If the website is doing its job, it disappears on Saturday morning and the room takes over.',
    'That is also why RSVP is not attendance. Saying you will come is a gift to the planning team. Walking in and checking in is the act that tells us you were there.'
  ],
  '/images/gallery-gathering.jpg',
  'A congregation gathered in a dim hall',
  'Daniel Adeyemi',
  'Host pastor',
  'Gathering',
  array['church', 'presence', 'rsvp'],
  'published',
  '2026-06-20T08:00:00+01:00',
  'Why we gather | Wonders of Worship Experience',
  'The difference between an online RSVP and being in the room for Wonders of Worship Experience.'
),
(
  'art-serve',
  'serving-with-joy',
  'Serving with joy',
  'Volunteer teams are not a backstage workforce. They are part of how the congregation learns to love one another.',
  array[
    'If you serve in 2026, you are not filling a gap in a production plot. You are helping people arrive, sing, pray and leave well.',
    'That requires patience with people who are late, grace for people who are confused, and a quiet willingness to do unglamorous things with care.',
    'The best teams are the ones whose work you feel before you notice who did it: the door that opened, the clear directions, the prayer team ready when the room opened.',
    'Applications close once each team reaches capacity so we can communicate with everyone personally before the day.'
  ],
  '/images/gallery-prayer.jpg',
  'Hands folded in prayer',
  'Chioma Nwosu',
  'Prayer and hospitality',
  'Service',
  array['volunteers', 'service', 'hospitality'],
  'published',
  '2026-06-05T08:00:00+01:00',
  'Serving with joy | Wonders of Worship Experience',
  'What it means to serve on volunteer teams for Wonders of Worship Experience 2026.'
),
(
  'art-reminders',
  'reminders-without-noise',
  'Reminders without noise',
  'Why we send at most two reminders, never broadcast unprompted messages, and allow unsubscribing in one tap.',
  array[
    'Digital messaging has made communication cheap and intrusive. Ministry announcements do not need to feel like spam.',
    'When you RSVP, we ask for WhatsApp or email consent because that is how we will tell you about doors, directions and parking.',
    'We do not send countdown promotions every week. You get a confirmation, a 48-hour reminder, and an event-day note.',
    'If you decide not to come, you can decline your RSVP from any message and we will stop sending updates immediately.'
  ],
  '/images/gallery-communion.jpg',
  'A communion table arranged simply',
  'Abraham Oyo-Ita',
  'Communications lead',
  'Communication',
  array['privacy', 'communication', 'consent'],
  'published',
  '2026-05-18T08:00:00+01:00',
  'Reminders without noise | Wonders of Worship Experience',
  'Our consent-first approach to event messaging, reminders and attendee data.'
)
on conflict (id) do nothing;

-- 5. Seed initial FAQs linked to 2026 edition
insert into public.faqs (
  id, edition_id, category, question, answer, sort_order, is_published
)
select
  seed.id,
  ed.id,
  seed.category,
  seed.question,
  seed.answer,
  seed.sort_order,
  true
from (
  values
    ('faq-venue', 'venue', 'Where is Wonders of Worship Experience 2026 holding?', 'Wonders of Worship Experience 2026 is holding at Sanctified Mount Zion Church, #25 Ibiono Street, Uyo, Akwa Ibom State, Nigeria. Reminder messages will carry the address and directions link.', 1),
    ('faq-time', 'time', 'What time should I arrive?', 'Doors are planned for 8:00 AM West Africa Time. The gathering begins at 9:00 AM. Arrive early if you want a seat near the front or if you are serving on a volunteer team.', 2),
    ('faq-entry', 'entry', 'Is there a ticket or registration fee?', 'No. RSVP is free and records your intention to attend. On the day, scan the venue QR code to check in. RSVP is not the same as attendance.', 3),
    ('faq-bring', 'what_to_bring', 'What should I bring?', 'Bring a Bible if you use one, water, and a heart ready to sing. Photography for personal memory is welcome during permitted moments. Full event photography will be shared in the gallery after the day.', 4),
    ('faq-children', 'children', 'Can I come with children?', 'Families are welcome. There is no separate children''s programme in this edition, so parents remain responsible for their children throughout the gathering. If that plan changes, we will say so clearly before the event.', 5),
    ('faq-access', 'accessibility', 'How accessible is the venue?', 'We will publish step-free access, seating support and contact details with the final venue note. If you need a specific arrangement, write to us through the contact page before the week of the event.', 6),
    ('faq-parking', 'parking', 'Is parking available at the venue?', 'Yes, street and managed parking will be guided by the parking team. Follow the parking volunteers when you arrive on Ibiono Street.', 7),
    ('faq-contact', 'contact', 'Who can I contact with questions before the event?', 'Use the contact form on this website or reply directly to any official email reminder. The communications team responds within two working days.', 8)
) as seed(id, category, question, answer, sort_order)
left join lateral (
  select id from public.event_editions where year = 2026 limit 1
) ed on true
on conflict (id) do nothing;
