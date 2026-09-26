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

-- Ministers are intentionally created through the admin console. Production
-- must not be pre-populated with fictional placeholder people.
