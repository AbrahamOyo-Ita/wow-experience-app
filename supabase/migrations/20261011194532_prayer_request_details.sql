alter table public.prayer_requests
  add column if not exists prayer_point text,
  add column if not exists desired_outcome text;

create index if not exists prayer_requests_created_at_idx
  on public.prayer_requests (created_at desc);

update public.prayer_requests
set prayer_point = coalesce(nullif(prayer_point, ''), prayer)
where prayer_point is null;

alter table public.prayer_requests
  add constraint prayer_requests_point_length check (
    prayer_point is null or char_length(prayer_point) between 10 and 2000
  ),
  add constraint prayer_requests_outcome_length check (
    desired_outcome is null or char_length(desired_outcome) between 5 and 1000
  );

drop policy if exists "admins_select_prayer_requests" on public.prayer_requests;
create policy "admins_select_prayer_requests"
on public.prayer_requests
for select
to authenticated
using (app_private.is_admin());

create or replace function app_private.submit_prayer_request(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.prayer_requests;
  errors jsonb := '[]'::jsonb;
  prayer_point_text text := trim(coalesce(payload->>'prayerPoint', ''));
  desired_outcome_text text := trim(coalesce(payload->>'desiredOutcome', ''));
  anonymous_request boolean := coalesce((payload->>'isAnonymous')::boolean, false);
  urgent_request boolean := coalesce((payload->>'isUrgent')::boolean, false);
  request_name text := nullif(trim(coalesce(payload->>'name', '')), '');
  request_source text := coalesce(nullif(trim(payload->>'source'), ''), 'prayer-page');
begin
  if not app_private.enforce_rate_limit('prayer-request', payload->>'ipHash') then
    return app_private.result('error', null, 'Too many attempts. Please wait a few minutes.');
  end if;

  if char_length(prayer_point_text) < 10 or char_length(prayer_point_text) > 2000 then
    errors := errors || app_private.field_error(
      'prayerPoint',
      'Write a prayer point between 10 and 2,000 characters.'
    );
  end if;
  if char_length(desired_outcome_text) < 5 or char_length(desired_outcome_text) > 1000 then
    errors := errors || app_private.field_error(
      'desiredOutcome',
      'Tell us what you are trusting God to do at the event.'
    );
  end if;
  if request_name is not null and char_length(request_name) > 120 then
    errors := errors || app_private.field_error('name', 'Keep your name under 120 characters.');
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
    prayer_point,
    desired_outcome,
    is_anonymous,
    is_urgent,
    source
  )
  values (
    case when anonymous_request then null else request_name end,
    prayer_point_text,
    prayer_point_text,
    desired_outcome_text,
    anonymous_request,
    urgent_request,
    request_source
  )
  returning * into created;

  return app_private.result('success', jsonb_build_object('id', created.id));
end;
$$;

revoke execute on function app_private.submit_prayer_request(jsonb) from public;
grant execute on function app_private.submit_prayer_request(jsonb) to anon, authenticated;
