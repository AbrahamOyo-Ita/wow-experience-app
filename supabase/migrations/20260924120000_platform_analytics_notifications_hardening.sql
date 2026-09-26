-- Production analytics and notification delivery hardening.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  session_id uuid not null,
  event_name text not null default 'page_view' check (event_name in ('page_view')),
  path text not null check (char_length(path) between 1 and 500),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 255),
  source text check (source is null or char_length(source) <= 100),
  utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 150),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  region text check (region is null or char_length(region) <= 120),
  city text check (city is null or char_length(city) <= 120),
  device_category text not null check (device_category in ('mobile', 'tablet', 'desktop')),
  created_at timestamptz not null default now()
);

create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_path_created_idx on public.analytics_events (path, created_at desc);
create index analytics_events_country_created_idx on public.analytics_events (country_code, created_at desc);
create index analytics_events_visitor_created_idx on public.analytics_events (visitor_id, created_at desc);
create index analytics_events_session_created_idx on public.analytics_events (session_id, created_at desc);

alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
grant all on table public.analytics_events to service_role;
grant usage, select on sequence public.analytics_events_id_seq to service_role;

alter table public.notifications
  add column provider_message_id text,
  add column automation_rule_id uuid references public.automation_rules (id) on delete set null,
  add column processing_started_at timestamptz;

alter table public.notification_attempts
  add column provider_message_id text,
  add column event_type text;

create index notifications_provider_message_idx
  on public.notifications (provider_message_id)
  where provider_message_id is not null;

create index notifications_processing_started_idx
  on public.notifications (processing_started_at)
  where status = 'processing';

create unique index notifications_automation_recipient_idx
  on public.notifications (automation_rule_id, contact_id, channel)
  where automation_rule_id is not null;

create table public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  provider_message_id text,
  event_type text not null,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

alter table public.provider_webhook_events enable row level security;
revoke all on table public.provider_webhook_events from anon, authenticated;
grant all on table public.provider_webhook_events to service_role;

create or replace function public.get_analytics_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_since timestamptz;
  v_result jsonb;
begin
  if not (select app_private.is_admin()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  v_since := date_trunc('day', now()) - make_interval(days => v_days - 1);

  with filtered as (
    select * from public.analytics_events where created_at >= v_since
  ),
  session_counts as (
    select session_id, count(*) as views from filtered group by session_id
  ),
  totals as (
    select
      count(*)::integer as page_views,
      count(distinct visitor_id)::integer as visitors,
      count(distinct session_id)::integer as sessions
    from filtered
  )
  select jsonb_build_object(
    'days', v_days,
    'pageViews', totals.page_views,
    'visitors', totals.visitors,
    'sessions', totals.sessions,
    'viewsPerSession', case when totals.sessions = 0 then 0 else round(totals.page_views::numeric / totals.sessions, 2) end,
    'bounceRate', coalesce((select round(100.0 * count(*) filter (where views = 1) / nullif(count(*), 0), 1) from session_counts), 0),
    'liveVisitors', (select count(distinct visitor_id)::integer from public.analytics_events where created_at >= now() - interval '5 minutes'),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('date', day::date, 'views', views, 'visitors', visitors) order by day)
      from (
        select series.day, count(f.id)::integer as views, count(distinct f.visitor_id)::integer as visitors
        from generate_series(date_trunc('day', v_since), date_trunc('day', now()), interval '1 day') series(day)
        left join filtered f on f.created_at >= series.day and f.created_at < series.day + interval '1 day'
        group by series.day
      ) d
    ), '[]'::jsonb),
    'topPages', coalesce((select jsonb_agg(to_jsonb(x)) from (select path as label, count(*)::integer as value from filtered group by path order by value desc limit 10) x), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(to_jsonb(x)) from (select coalesce(country_code, 'Unknown') as label, count(*)::integer as value from filtered group by country_code order by value desc limit 10) x), '[]'::jsonb),
    'cities', coalesce((select jsonb_agg(to_jsonb(x)) from (select coalesce(city, 'Unknown') as label, count(*)::integer as value from filtered group by city order by value desc limit 10) x), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(to_jsonb(x)) from (select coalesce(source, 'Direct') as label, count(*)::integer as value from filtered group by source order by value desc limit 10) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(to_jsonb(x)) from (select device_category as label, count(*)::integer as value from filtered group by device_category order by value desc) x), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(to_jsonb(x)) from (select coalesce(referrer_host, 'Direct') as label, count(*)::integer as value from filtered group by referrer_host order by value desc limit 10) x), '[]'::jsonb)
  ) into v_result
  from totals;

  return v_result;
end;
$$;

revoke all on function public.get_analytics_dashboard(integer) from public, anon;
grant execute on function public.get_analytics_dashboard(integer) to authenticated;
