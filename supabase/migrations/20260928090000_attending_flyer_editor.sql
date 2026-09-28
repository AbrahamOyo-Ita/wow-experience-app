-- Versioned normalized geometry for the attending-flyer editor.
alter table public.flyer_templates
  add column if not exists base_width integer not null default 2000,
  add column if not exists base_height integer not null default 2500,
  add column if not exists config_version integer not null default 1,
  add column if not exists config jsonb not null default '{"version":1,"baseWidth":2000,"baseHeight":2500,"photoArea":{"shape":"circle","cx":0.5035,"cy":0.484,"r":0.278},"textArea":{"x":0.18,"y":0.72,"w":0.64,"h":0.055,"align":"center","fontFamily":"Manrope, Arial, sans-serif","fontWeight":800,"maxFontSize":74,"minFontSize":28,"color":"#ffffff","transform":"uppercase","maxChars":40,"placeholder":"Put your name here"}}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'flyer_templates_dimensions_check' and conrelid = 'public.flyer_templates'::regclass) then
    alter table public.flyer_templates add constraint flyer_templates_dimensions_check
      check (base_width between 320 and 10000 and base_height between 320 and 10000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'flyer_templates_config_check' and conrelid = 'public.flyer_templates'::regclass) then
    alter table public.flyer_templates add constraint flyer_templates_config_check check (
      config_version = 1
      and jsonb_typeof(config) = 'object'
      and (config ->> 'version')::integer = config_version
      and (config ->> 'baseWidth')::integer = base_width
      and (config ->> 'baseHeight')::integer = base_height
      and (config #>> '{photoArea,shape}') = 'circle'
      and (config #>> '{photoArea,cx}')::numeric between 0 and 1
      and (config #>> '{photoArea,cy}')::numeric between 0 and 1
      and (config #>> '{photoArea,r}')::numeric > 0
      and (config #>> '{photoArea,r}')::numeric <= 0.5
      and (config #>> '{textArea,x}')::numeric between 0 and 1
      and (config #>> '{textArea,y}')::numeric between 0 and 1
      and (config #>> '{textArea,w}')::numeric > 0
      and (config #>> '{textArea,h}')::numeric > 0
      and (config #>> '{textArea,x}')::numeric + (config #>> '{textArea,w}')::numeric <= 1
      and (config #>> '{textArea,y}')::numeric + (config #>> '{textArea,h}')::numeric <= 1
    );
  end if;
end $$;

-- Editing a public campaign asset is intentionally restricted beyond general content editing.
drop policy if exists "authorized_read_flyer_templates" on public.flyer_templates;
drop policy if exists "authorized_insert_flyer_templates" on public.flyer_templates;
drop policy if exists "authorized_update_flyer_templates" on public.flyer_templates;
drop policy if exists "authorized_delete_flyer_templates" on public.flyer_templates;
create policy "super_admin_read_flyer_templates" on public.flyer_templates for select to authenticated
using (exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'));
create policy "super_admin_insert_flyer_templates" on public.flyer_templates for insert to authenticated
with check (exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'));
create policy "super_admin_update_flyer_templates" on public.flyer_templates for update to authenticated
using (exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'))
with check (exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'));
create policy "super_admin_delete_flyer_templates" on public.flyer_templates for delete to authenticated
using (exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'));

drop policy if exists "authorized_upload_flyer_templates" on storage.objects;
drop policy if exists "authorized_update_flyer_templates" on storage.objects;
drop policy if exists "authorized_delete_flyer_templates" on storage.objects;
create policy "super_admin_upload_flyer_templates" on storage.objects for insert to authenticated
with check (bucket_id = 'flyer-templates' and exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'));
create policy "super_admin_update_flyer_templates" on storage.objects for update to authenticated
using (bucket_id = 'flyer-templates' and exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'))
with check (bucket_id = 'flyer-templates' and exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'));
create policy "super_admin_delete_flyer_templates" on storage.objects for delete to authenticated
using (bucket_id = 'flyer-templates' and exists (select 1 from public.profile_roles r join public.profiles p on p.id = r.profile_id where r.profile_id = (select auth.uid()) and r.role = 'super_admin' and p.status = 'active'));

insert into public.flyer_templates (id, name, file_name, mime_type, image_url, storage_path, is_published, base_width, base_height, config_version, config)
values (
  'active-attending-flyer', 'WOW Experience 2026 Attending Flyer', 'WOW EXPERIENCE ATTENDING.png', 'image/png',
  '/images/WOW%20EXPERIENCE%20ATTENDING.png', 'seed/WOW EXPERIENCE ATTENDING.png', true, 2000, 2500, 1,
  '{"version":1,"baseWidth":2000,"baseHeight":2500,"photoArea":{"shape":"circle","cx":0.5035,"cy":0.484,"r":0.278},"textArea":{"x":0.18,"y":0.72,"w":0.64,"h":0.055,"align":"center","fontFamily":"Manrope, Arial, sans-serif","fontWeight":800,"maxFontSize":74,"minFontSize":28,"color":"#ffffff","transform":"uppercase","maxChars":40,"placeholder":"Put your name here"}}'::jsonb
)
on conflict (id) do update set
  base_width = excluded.base_width, base_height = excluded.base_height,
  config_version = excluded.config_version, config = excluded.config;

grant select on public.flyer_templates to anon, authenticated;
grant insert, update, delete on public.flyer_templates to authenticated, service_role;
