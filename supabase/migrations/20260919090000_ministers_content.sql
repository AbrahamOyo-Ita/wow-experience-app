create table public.ministers (
  id text primary key,
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  role text not null default '' check (char_length(role) <= 120),
  bio text not null default '' check (char_length(bio) <= 2000),
  image_src text not null default '',
  image_alt text not null default '',
  featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 1 check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ministers_edition_visibility_order_idx
on public.ministers (edition_id, is_published, featured, sort_order);

create trigger ministers_updated_at before update on public.ministers
for each row execute function app_private.set_updated_at();

alter table public.ministers enable row level security;

revoke all on table public.ministers from anon, authenticated;
grant select on table public.ministers to anon, authenticated;
grant insert, update, delete on table public.ministers to authenticated;

create policy "public_read_published_ministers"
on public.ministers
for select
to anon, authenticated
using (is_published or (select app_private.is_admin()));

create policy "admins_insert_ministers"
on public.ministers
for insert
to authenticated
with check ((select app_private.is_admin()));

create policy "admins_update_ministers"
on public.ministers
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy "admins_delete_ministers"
on public.ministers
for delete
to authenticated
using ((select app_private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'minister-images',
  'minister-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "admins_upload_minister_images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'minister-images'
  and (select app_private.is_admin())
);

create policy "admins_delete_minister_images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'minister-images'
  and (select app_private.is_admin())
);

insert into public.ministers (
  id,
  edition_id,
  name,
  role,
  bio,
  image_src,
  image_alt,
  featured,
  is_published,
  sort_order
)
select seed.id,
       edition.id,
       seed.name,
       seed.role,
       seed.bio,
       seed.image_src,
       seed.image_alt,
       true,
       false,
       seed.sort_order
from public.event_editions edition
cross join (
  values
    ('min-amara', 'Amara Okonkwo', 'Worship Lead', 'Amara leads congregational singing with a clear pastoral instinct.', '/images/minister-amara.jpg', 'Portrait of Amara Okonkwo', 1),
    ('min-daniel', 'Daniel Adeyemi', 'Host Pastor', 'Daniel hosts the day and frames the gathering around Scripture.', '/images/minister-daniel.jpg', 'Portrait of Daniel Adeyemi', 2),
    ('min-kwame', 'Kwame Mensah', 'Music Director', 'Kwame shapes the musical language of the gathering.', '/images/minister-kwame.jpg', 'Portrait of Kwame Mensah', 3),
    ('min-chioma', 'Chioma Nwosu', 'Prayer and Hospitality', 'Chioma leads the prayer team and the welcome floor.', '/images/minister-chioma.jpg', 'Portrait of Chioma Nwosu', 4),
    ('min-tunde', 'Tunde Balogun', 'Teacher of the Word', 'Tunde opens Scripture with patience and weight.', '/images/minister-tunde.jpg', 'Portrait of Tunde Balogun', 5),
    ('min-grace', 'Grace Okafor', 'Vocal Lead and Intercessor', 'Grace brings a profound spirit of prayer and vocal ministering to the platform.', '/images/minister-grace.jpg', 'Portrait of Grace Okafor', 6)
) as seed(id, name, role, bio, image_src, image_alt, sort_order)
where edition.legacy_key = 'edition-2026'
on conflict (id) do nothing;
