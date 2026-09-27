-- Storage bucket for flyer templates
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flyer-templates',
  'flyer-templates',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
create policy "public_read_flyer_template_images"
on storage.objects
for select
to public
using (bucket_id = 'flyer-templates');

create policy "admins_upload_flyer_templates"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'flyer-templates'
  and (select app_private.is_admin())
);

create policy "admins_update_flyer_templates"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'flyer-templates'
  and (select app_private.is_admin())
)
with check (
  bucket_id = 'flyer-templates'
  and (select app_private.is_admin())
);

create policy "admins_delete_flyer_templates"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'flyer-templates'
  and (select app_private.is_admin())
);

-- Flyer templates metadata table
create table if not exists public.flyer_templates (
  id text primary key,
  edition_id uuid references public.event_editions(id) on delete set null,
  name text not null,
  file_name text not null,
  mime_type text not null,
  image_url text not null,
  storage_path text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flyer_templates enable row level security;

-- Table RLS policies
create policy "public_read_published_flyer_templates"
on public.flyer_templates
for select
to public
using (is_published = true);

create policy "admins_read_all_flyer_templates"
on public.flyer_templates
for select
to authenticated
using ((select app_private.is_admin()));

create policy "admins_insert_flyer_templates"
on public.flyer_templates
for insert
to authenticated
with check ((select app_private.is_admin()));

create policy "admins_update_flyer_templates"
on public.flyer_templates
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy "admins_delete_flyer_templates"
on public.flyer_templates
for delete
to authenticated
using ((select app_private.is_admin()));
