create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to postgres, service_role, anon, authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.normalize_ng_phone(input text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  digits := regexp_replace(coalesce(input, ''), '\D', '', 'g');
  if digits = '' then
    return null;
  end if;
  if left(digits, 1) = '0' and length(digits) = 11 then
    digits := '234' || substr(digits, 2);
  elsif length(digits) = 10 then
    digits := '234' || digits;
  end if;
  if left(digits, 3) <> '234' or length(digits) <> 13 then
    return null;
  end if;
  return '+' || digits;
end;
$$;

create or replace function app_private.normalize_email(input text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(coalesce(input, ''))), '');
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('super_admin', 'event_admin', 'communications_manager', 'content_editor')),
  created_at timestamptz not null default now(),
  primary key (profile_id, role)
);

create table public.event_editions (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  legacy_key text not null unique,
  slug text not null unique,
  name text not null,
  short_name text not null,
  theme text not null default '',
  statement text not null default '',
  description text not null default '',
  timezone text not null default 'Africa/Lagos',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  doors_at timestamptz not null,
  venue_name text not null,
  venue_address text not null,
  venue_city text not null default 'Lagos',
  venue_country text not null default 'Nigeria',
  directions_url text not null default '',
  venue_notes text not null default '',
  status text not null check (status in ('draft', 'scheduled', 'published', 'live', 'completed', 'archived')),
  published_at timestamptz,
  gallery_drive_url text not null default '',
  attendance_url text not null,
  attendance_window_starts_at timestamptz not null,
  attendance_window_ends_at timestamptz not null,
  preview_check_in boolean not null default false,
  reminder_two_day_enabled boolean not null default true,
  reminder_event_day_enabled boolean not null default true,
  reminder_event_day_time text not null default '07:00',
  qr_target_url text not null,
  is_date_placeholder boolean not null default false,
  is_venue_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.volunteer_teams (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  team_key text not null,
  name text not null,
  slug text not null,
  description text not null default '',
  expectation text not null default '',
  capacity integer not null default 0,
  status text not null default 'open' check (status in ('open', 'closed')),
  unique (edition_id, team_key),
  unique (edition_id, slug)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null default '',
  email text,
  email_normalized text,
  phone text not null,
  phone_normalized text not null,
  occupation text,
  location text,
  preferred_channel text not null check (preferred_channel in ('whatsapp', 'email', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index contacts_phone_normalized_uidx on public.contacts (phone_normalized);
create unique index contacts_email_normalized_uidx on public.contacts (email_normalized) where email_normalized is not null;

create table public.contact_consents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  purpose text not null check (purpose in ('event_reminders', 'volunteer_updates', 'enquiry', 'attendance')),
  channel text not null check (channel in ('whatsapp', 'email')),
  status text not null check (status in ('granted', 'revoked')),
  source text not null default 'form',
  policy_version text not null default '2026.1',
  captured_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (contact_id, purpose, channel)
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  response text not null check (response in ('attending', 'not_attending')),
  source text not null default 'modal',
  preferred_channel text not null check (preferred_channel in ('whatsapp', 'email', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, contact_id)
);

create table public.rsvp_declines (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  source text not null default 'modal',
  created_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  source text not null default 'qr' check (source in ('qr', 'admin')),
  occupation_snapshot text not null default '',
  device_category text not null default 'mobile' check (device_category in ('mobile', 'tablet', 'desktop')),
  duplicate_of_id uuid references public.attendance_records (id),
  created_by uuid references public.profiles (id),
  unique (edition_id, contact_id)
);

create table public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  team_id uuid not null references public.volunteer_teams (id),
  experience text not null,
  availability text not null,
  motivation text not null,
  occupation text,
  location text,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'accepted', 'waitlisted', 'declined')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, contact_id)
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid references public.event_editions (id) on delete cascade,
  name text not null,
  category text not null check (category in ('rsvp', 'reminder', 'volunteer', 'attendance', 'thank_you', 'follow_up', 'general')),
  channel text not null check (channel in ('email', 'whatsapp')),
  subject text,
  preview_text text,
  body text not null,
  variables text[] not null default '{}',
  version integer not null default 1,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  name text not null,
  type text not null default 'broadcast' check (type in ('broadcast', 'automation', 'test')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'queueing', 'sending', 'completed', 'cancelled', 'failed')),
  channel_mode text not null check (channel_mode in ('whatsapp', 'email', 'both', 'fallback')),
  audience_label text not null default '',
  subject text,
  whatsapp_body text,
  email_body text,
  scheduled_at timestamptz,
  eligible_count integer not null default 0,
  excluded_count integer not null default 0,
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.event_editions (id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in (
    'rsvp_confirmation',
    'two_day_reminder',
    'event_day_reminder',
    'volunteer_receipt',
    'volunteer_acceptance',
    'post_event_thank_you',
    'email_fallback'
  )),
  offset_minutes integer,
  run_time text,
  channel_mode text not null check (channel_mode in ('whatsapp', 'email', 'both', 'fallback')),
  enabled boolean not null default true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_run_status text check (last_run_status in ('success', 'partial', 'failed', 'never')),
  unique (edition_id, trigger_type)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid references public.event_editions (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  channel text not null check (channel in ('email', 'whatsapp')),
  template_key text not null,
  to_address text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'delivered', 'failed', 'skipped', 'cancelled')),
  skip_reason text,
  error_message text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_queue_idx on public.notifications (status, scheduled_for) where status in ('queued', 'failed');

create table public.notification_attempts (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel text not null,
  provider text not null,
  success boolean not null,
  response_preview text,
  created_at timestamptz not null default now()
);

create table public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text not null unique,
  display_name text not null,
  masked_phone text not null default '',
  provider text not null default 'openwa',
  status text not null default 'disconnected' check (status in (
    'connected', 'disconnected', 'qr_required', 'connecting', 'degraded', 'rate_limited'
  )),
  last_seen_at timestamptz,
  last_activity text not null default 'No host configured yet.',
  health_note text not null default 'OpenWA is not connected. Email fallback will be used when a Resend key is present.',
  last_error_code text,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  actor_name text not null default 'System',
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  metadata_preview text not null default '',
  created_at timestamptz not null default now()
);

create table public.form_rate_limits (
  id bigint generated always as identity primary key,
  action text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index form_rate_limits_lookup_idx on public.form_rate_limits (ip_hash, action, created_at);

create trigger profiles_updated_at before update on public.profiles
for each row execute function app_private.set_updated_at();
create trigger event_editions_updated_at before update on public.event_editions
for each row execute function app_private.set_updated_at();
create trigger contacts_updated_at before update on public.contacts
for each row execute function app_private.set_updated_at();
create trigger rsvps_updated_at before update on public.rsvps
for each row execute function app_private.set_updated_at();
create trigger volunteer_applications_updated_at before update on public.volunteer_applications
for each row execute function app_private.set_updated_at();
create trigger message_templates_updated_at before update on public.message_templates
for each row execute function app_private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.event_editions enable row level security;
alter table public.volunteer_teams enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_consents enable row level security;
alter table public.rsvps enable row level security;
alter table public.rsvp_declines enable row level security;
alter table public.attendance_records enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.enquiries enable row level security;
alter table public.message_templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.automation_rules enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_attempts enable row level security;
alter table public.whatsapp_sessions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.form_rate_limits enable row level security;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles
    where profile_id = (select auth.uid())
  );
$$;

create or replace function app_private.has_role(target text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles
    where profile_id = (select auth.uid())
      and role = target
  );
$$;

grant execute on function app_private.is_admin() to authenticated, anon;
grant execute on function app_private.has_role(text) to authenticated, anon;

create policy "public_read_published_editions"
on public.event_editions
for select
to anon, authenticated
using (status in ('published', 'live', 'completed', 'archived') or app_private.is_admin());

create policy "admins_write_editions"
on public.event_editions
for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "public_read_open_teams"
on public.volunteer_teams
for select
to anon, authenticated
using (
  exists (
    select 1 from public.event_editions e
    where e.id = volunteer_teams.edition_id
      and (e.status in ('published', 'live', 'completed', 'archived') or app_private.is_admin())
  )
);

create policy "admins_write_teams"
on public.volunteer_teams
for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "admins_read_profiles"
on public.profiles
for select
to authenticated
using (app_private.is_admin() or id = (select auth.uid()));

create policy "admins_read_roles"
on public.profile_roles
for select
to authenticated
using (app_private.is_admin() or profile_id = (select auth.uid()));

create policy "super_admins_write_roles"
on public.profile_roles
for all
to authenticated
using (app_private.has_role('super_admin'))
with check (app_private.has_role('super_admin'));

create policy "admins_select_contacts"
on public.contacts for select to authenticated using (app_private.is_admin());
create policy "admins_update_contacts"
on public.contacts for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

create policy "admins_select_consents"
on public.contact_consents for select to authenticated using (app_private.is_admin());
create policy "admins_update_consents"
on public.contact_consents for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

create policy "admins_select_rsvps"
on public.rsvps for select to authenticated using (app_private.is_admin());
create policy "admins_select_declines"
on public.rsvp_declines for select to authenticated using (app_private.is_admin());
create policy "admins_select_attendance"
on public.attendance_records for select to authenticated using (app_private.is_admin());
create policy "admins_insert_attendance"
on public.attendance_records for insert to authenticated with check (app_private.is_admin());
create policy "admins_select_volunteers"
on public.volunteer_applications for select to authenticated using (app_private.is_admin());
create policy "admins_update_volunteers"
on public.volunteer_applications for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
create policy "admins_select_enquiries"
on public.enquiries for select to authenticated using (app_private.is_admin());
create policy "admins_all_templates"
on public.message_templates for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
create policy "admins_all_campaigns"
on public.campaigns for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
create policy "admins_all_automations"
on public.automation_rules for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
create policy "admins_select_notifications"
on public.notifications for select to authenticated using (app_private.is_admin());
create policy "admins_select_attempts"
on public.notification_attempts for select to authenticated using (app_private.is_admin());
create policy "admins_all_whatsapp"
on public.whatsapp_sessions for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
create policy "admins_select_audit"
on public.audit_logs for select to authenticated using (app_private.is_admin());
create policy "admins_insert_audit"
on public.audit_logs for insert to authenticated with check (app_private.is_admin());
