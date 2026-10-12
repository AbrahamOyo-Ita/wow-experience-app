create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  prayer text not null,
  is_anonymous boolean not null default false,
  is_urgent boolean not null default false,
  source text not null default 'prayer-page',
  status text not null default 'received'
    check (status in ('received', 'praying', 'answered', 'archived')),
  created_at timestamptz not null default now(),
  constraint prayer_requests_name_length check (name is null or char_length(name) <= 120),
  constraint prayer_requests_prayer_length check (
    char_length(prayer) between 10 and 3000
  ),
  constraint prayer_requests_source_length check (char_length(source) between 1 and 80)
);

alter table public.prayer_requests enable row level security;

revoke all on table public.prayer_requests from anon, authenticated;

-- Prayer requests are commonly submitted by many visitors on one church or
-- mobile-carrier network, so give this form its own shared-network allowance.
create or replace function app_private.enforce_rate_limit(action text, ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  hits integer;
  request_limit integer := case action
    when 'rsvp' then 300
    when 'attendance' then 1000
    when 'volunteer' then 60
    when 'newsletter' then 30
    when 'enquiry' then 20
    when 'prayer-request' then 120
    else 12
  end;
begin
  if ip_hash is null or ip_hash = '' then
    return true;
  end if;

  delete from public.form_rate_limits
  where created_at < now() - interval '1 hour';

  select count(*) into hits
  from public.form_rate_limits
  where form_rate_limits.ip_hash = enforce_rate_limit.ip_hash
    and form_rate_limits.action = enforce_rate_limit.action
    and created_at > now() - interval '10 minutes';

  if hits >= request_limit then
    return false;
  end if;

  insert into public.form_rate_limits (action, ip_hash)
  values (action, ip_hash);
  return true;
end;
$$;

revoke all on function app_private.enforce_rate_limit(text, text) from public;

create or replace function app_private.submit_prayer_request(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.prayer_requests;
  errors jsonb := '[]'::jsonb;
  prayer_text text := trim(coalesce(payload->>'prayer', ''));
  anonymous_request boolean := coalesce((payload->>'isAnonymous')::boolean, false);
  urgent_request boolean := coalesce((payload->>'isUrgent')::boolean, false);
  request_name text := nullif(trim(coalesce(payload->>'name', '')), '');
  request_source text := coalesce(nullif(trim(payload->>'source'), ''), 'prayer-page');
begin
  if not app_private.enforce_rate_limit('prayer-request', payload->>'ipHash') then
    return app_private.result('error', null, 'Too many attempts. Please wait a few minutes.');
  end if;

  if char_length(prayer_text) < 10 then
    errors := errors || app_private.field_error(
      'prayer',
      'Please write a little more so we can pray with understanding.'
    );
  end if;
  if char_length(prayer_text) > 3000 then
    errors := errors || app_private.field_error(
      'prayer',
      'Keep your prayer request under 3,000 characters.'
    );
  end if;
  if request_name is not null and char_length(request_name) > 120 then
    errors := errors || app_private.field_error(
      'name',
      'Keep your name under 120 characters.'
    );
  end if;
  if char_length(request_source) > 80 then
    errors := errors || app_private.field_error('form', 'The submission source is invalid.');
  end if;
  if errors <> '[]'::jsonb then
    return app_private.result('validation', null, null, errors);
  end if;

  insert into public.prayer_requests (
    name,
    prayer,
    is_anonymous,
    is_urgent,
    source
  )
  values (
    case when anonymous_request then null else request_name end,
    prayer_text,
    anonymous_request,
    urgent_request,
    request_source
  )
  returning * into created;

  return app_private.result('success', jsonb_build_object('id', created.id));
end;
$$;

create or replace function public.submit_prayer_request(payload jsonb)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.submit_prayer_request(payload);
$$;

revoke execute on function app_private.submit_prayer_request(jsonb) from public;
revoke execute on function public.submit_prayer_request(jsonb) from public;
grant execute on function app_private.submit_prayer_request(jsonb) to anon, authenticated;
grant execute on function public.submit_prayer_request(jsonb) to anon, authenticated;
