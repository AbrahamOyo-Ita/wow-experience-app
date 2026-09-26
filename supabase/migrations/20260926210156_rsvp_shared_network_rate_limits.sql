-- Public forms are often completed by many people behind the same church,
-- office, or mobile-carrier NAT. Keep abuse protection without treating a
-- shared public IP as a single person.
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

-- Lock helper resolution to prevent objects in a caller-controlled schema from
-- shadowing names used by database functions and triggers.
alter function app_private.set_updated_at() set search_path = '';
alter function app_private.normalize_ng_phone(text) set search_path = '';
alter function app_private.normalize_email(text) set search_path = '';
alter function app_private.field_error(text, text) set search_path = '';
alter function app_private.split_name(text, text) set search_path = '';
alter function app_private.result(text, jsonb, text, jsonb) set search_path = '';
alter function app_private.rsvp_json(public.rsvps, text) set search_path = '';
alter function app_private.newsletter_subscriber_json(public.newsletter_subscribers) set search_path = '';
