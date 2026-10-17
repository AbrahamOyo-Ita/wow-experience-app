create table if not exists public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default encode(gen_random_bytes(18), 'hex'),
  event_name text not null default '',
  status text not null default 'idle' check (status in ('idle', 'running', 'paused', 'completed')),
  current_segment_index integer not null default 0,
  running_started_at timestamptz,
  blackout boolean not null default false,
  frozen boolean not null default false,
  flash_message text,
  display_config jsonb not null default '{"theme":"dark","accent":"#D7A84A","fontSize":"xl","showTitle":true,"showSpeaker":true,"showClock":true,"showProgress":true,"showNext":true,"soundEnabled":false,"warningSeconds":300,"redSeconds":60,"warningColor":"#f4c95d","redColor":"#f87171","overtimeColor":"#ef4444"}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timer_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.timer_sessions(id) on delete cascade,
  position integer not null,
  title text not null,
  speaker text not null default '',
  duration_seconds integer not null default 600 check (duration_seconds between 1 and 86400),
  segment_type text not null default 'custom' check (segment_type in ('speaker', 'break', 'worship', 'announcement', 'custom')),
  notes text not null default '',
  warning_seconds integer not null default 300 check (warning_seconds between 0 and 86400),
  auto_advance boolean not null default false,
  overtime_mode boolean not null default true,
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  adjustment_seconds integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, position)
);

create table if not exists public.timer_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_name text not null default '',
  segments jsonb not null default '[]'::jsonb,
  display_config jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timer_action_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.timer_sessions(id) on delete cascade,
  segment_id uuid references public.timer_segments(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  seconds_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists timer_segments_session_position_idx on public.timer_segments(session_id, position);
create index if not exists timer_action_log_session_created_idx on public.timer_action_log(session_id, created_at desc);
create index if not exists timer_templates_updated_idx on public.timer_templates(updated_at desc);

drop trigger if exists timer_sessions_updated_at on public.timer_sessions;
create trigger timer_sessions_updated_at before update on public.timer_sessions
for each row execute function app_private.set_updated_at();
drop trigger if exists timer_segments_updated_at on public.timer_segments;
create trigger timer_segments_updated_at before update on public.timer_segments
for each row execute function app_private.set_updated_at();
drop trigger if exists timer_templates_updated_at on public.timer_templates;
create trigger timer_templates_updated_at before update on public.timer_templates
for each row execute function app_private.set_updated_at();

alter table public.timer_sessions enable row level security;
alter table public.timer_segments enable row level security;
alter table public.timer_templates enable row level security;
alter table public.timer_action_log enable row level security;

drop policy if exists "admins_all_timer_sessions" on public.timer_sessions;
create policy "admins_all_timer_sessions" on public.timer_sessions for all to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "public_read_timer_sessions" on public.timer_sessions;
create policy "public_read_timer_sessions" on public.timer_sessions for select to anon, authenticated using (true);
drop policy if exists "admins_all_timer_segments" on public.timer_segments;
create policy "admins_all_timer_segments" on public.timer_segments for all to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "admins_all_timer_templates" on public.timer_templates;
create policy "admins_all_timer_templates" on public.timer_templates for all to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "admins_select_timer_action_log" on public.timer_action_log;
create policy "admins_select_timer_action_log" on public.timer_action_log for select to authenticated
using (app_private.is_admin());

grant all on public.timer_sessions, public.timer_segments, public.timer_templates, public.timer_action_log to service_role;
grant select on public.timer_templates to authenticated;
grant select on public.timer_sessions to anon, authenticated;

create or replace view public.timer_display_state as
select
  s.id as session_id,
  s.public_code,
  s.event_name,
  s.status,
  s.current_segment_index,
  s.running_started_at,
  s.blackout,
  s.frozen,
  s.flash_message,
  s.display_config,
  s.updated_at,
  coalesce(jsonb_agg(jsonb_build_object(
    'id', g.id,
    'position', g.position,
    'title', g.title,
    'speaker', g.speaker,
    'durationSeconds', g.duration_seconds,
    'warningSeconds', g.warning_seconds,
    'autoAdvance', g.auto_advance,
    'overtimeMode', g.overtime_mode,
    'elapsedSeconds', g.elapsed_seconds,
    'adjustmentSeconds', g.adjustment_seconds,
    'startedAt', g.started_at
  ) order by g.position) filter (where g.id is not null), '[]'::jsonb) as segments
from public.timer_sessions s
left join public.timer_segments g on g.session_id = s.id
group by s.id;

revoke all on public.timer_display_state from public;
grant select on public.timer_display_state to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and c.relname = 'timer_sessions'
  ) then alter publication supabase_realtime add table public.timer_sessions; end if;
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and c.relname = 'timer_segments'
  ) then alter publication supabase_realtime add table public.timer_segments; end if;
end $$;
