-- Keep the privileged analytics implementation outside the exposed Data API
-- schema. The public function remains a security-invoker facade, while the
-- internal function performs its existing auth.uid()-based admin check.
alter function public.get_analytics_dashboard(integer) set schema app_private;

revoke all on function app_private.get_analytics_dashboard(integer) from public, anon;
grant execute on function app_private.get_analytics_dashboard(integer) to authenticated;

create function public.get_analytics_dashboard(p_days integer default 30)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.get_analytics_dashboard(p_days);
$$;

revoke all on function public.get_analytics_dashboard(integer) from public, anon;
grant execute on function public.get_analytics_dashboard(integer) to authenticated;

-- Postgres Changes is appropriate here because the admin audience is small.
-- RLS is still evaluated for each authenticated subscriber.
do $$
declare
  table_name text;
  live_tables text[] := array[
    'profiles',
    'profile_roles',
    'contacts',
    'contact_consents',
    'rsvps',
    'attendance_records',
    'volunteer_applications',
    'campaigns',
    'newsletters',
    'newsletter_subscribers',
    'message_templates',
    'automation_rules',
    'audit_logs',
    'event_editions',
    'whatsapp_sessions',
    'ministers',
    'articles',
    'faqs'
  ];
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime' and puballtables
  ) then
    return;
  end if;

  foreach table_name in array live_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
