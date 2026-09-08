create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'admin'), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email;

  if not exists (select 1 from public.profile_roles) then
    insert into public.profile_roles (profile_id, role)
    values (new.id, 'super_admin');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

create or replace function app_private.result(status text, data jsonb default null, message text default null, errors jsonb default '[]'::jsonb)
returns jsonb
language sql
immutable
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'status', status,
    'data', data,
    'message', message,
    'errors', case when errors = '[]'::jsonb then null else errors end
  ));
$$;

create or replace function app_private.field_error(field text, message text)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('field', field, 'message', message);
$$;

create or replace function app_private.enforce_rate_limit(action text, ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  hits integer;
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

  if hits >= 12 then
    return false;
  end if;

  insert into public.form_rate_limits (action, ip_hash)
  values (action, ip_hash);
  return true;
end;
$$;

create or replace function app_private.resolve_edition(ref text)
returns public.event_editions
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  found public.event_editions;
begin
  select * into found
  from public.event_editions
  where id::text = ref
     or legacy_key = ref
     or slug = ref
     or year::text = ref
  limit 1;
  return found;
end;
$$;

create or replace function app_private.split_name(full_name text, first_only text)
returns table (first_name text, last_name text)
language plpgsql
immutable
as $$
declare
  trimmed text;
  parts text[];
begin
  trimmed := trim(coalesce(nullif(full_name, ''), first_only, ''));
  parts := regexp_split_to_array(trimmed, '\s+');
  first_name := coalesce(parts[1], 'Friend');
  if array_length(parts, 1) > 1 then
    last_name := array_to_string(parts[2:], ' ');
  else
    last_name := '';
  end if;
  return next;
end;
$$;

create or replace function app_private.upsert_contact(
  first_name text,
  last_name text,
  email text,
  phone text,
  occupation text,
  location text,
  preferred_channel text
)
returns public.contacts
language plpgsql
security definer
set search_path = ''
as $$
declare
  phone_norm text;
  email_norm text;
  found public.contacts;
begin
  phone_norm := app_private.normalize_ng_phone(phone);
  email_norm := app_private.normalize_email(email);

  select * into found
  from public.contacts
  where phone_normalized = phone_norm
     or (email_norm is not null and email_normalized = email_norm)
  order by created_at
  limit 1;

  if found.id is not null then
    update public.contacts
    set
      first_name = coalesce(nullif(first_name, ''), found.first_name),
      last_name = case when last_name <> '' then last_name else found.last_name end,
      email = coalesce(email, found.email),
      email_normalized = coalesce(email_norm, found.email_normalized),
      phone = '+' || substr(phone_norm, 2),
      phone_normalized = phone_norm,
      occupation = coalesce(occupation, found.occupation),
      location = coalesce(location, found.location),
      preferred_channel = preferred_channel
    where id = found.id
    returning * into found;
    return found;
  end if;

  insert into public.contacts (
    first_name, last_name, email, email_normalized, phone, phone_normalized,
    occupation, location, preferred_channel
  )
  values (
    first_name,
    coalesce(last_name, ''),
    email,
    email_norm,
    phone_norm,
    phone_norm,
    occupation,
    location,
    preferred_channel
  )
  returning * into found;
  return found;
end;
$$;

create or replace function app_private.set_consent(
  p_contact uuid,
  p_purpose text,
  p_channel text,
  p_granted boolean,
  p_source text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.contact_consents (contact_id, purpose, channel, status, source, captured_at, revoked_at)
  values (
    p_contact,
    p_purpose,
    p_channel,
    case when p_granted then 'granted' else 'revoked' end,
    p_source,
    now(),
    case when p_granted then null else now() end
  )
  on conflict (contact_id, purpose, channel)
  do update set
    status = excluded.status,
    source = excluded.source,
    captured_at = case when excluded.status = 'granted' then now() else public.contact_consents.captured_at end,
    revoked_at = case when excluded.status = 'revoked' then now() else null end;
end;
$$;

create or replace function app_private.queue_message(
  edition uuid,
  contact uuid,
  channel text,
  template_key text,
  to_address text,
  payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    edition_id, contact_id, channel, template_key, to_address, payload, status
  )
  values (edition, contact, channel, template_key, to_address, payload, 'queued');
end;
$$;

create or replace function app_private.rsvp_json(rsvp_row public.rsvps, legacy text)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', rsvp_row.id,
    'eventId', legacy,
    'contactId', rsvp_row.contact_id,
    'response', rsvp_row.response,
    'source', rsvp_row.source,
    'preferredChannel', rsvp_row.preferred_channel,
    'createdAt', rsvp_row.created_at,
    'updatedAt', rsvp_row.updated_at
  );
$$;

create or replace function app_private.submit_rsvp(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  edition public.event_editions;
  contact public.contacts;
  existing public.rsvps;
  created public.rsvps;
  phone_norm text;
  channel text;
  whatsapp_ok boolean;
  email_ok boolean;
  errors jsonb := '[]'::jsonb;
  names record;
begin
  if not app_private.enforce_rate_limit('rsvp', payload->>'ipHash') then
    return app_private.result('error', null, 'Too many attempts. Please wait a few minutes.');
  end if;

  edition := app_private.resolve_edition(coalesce(payload->>'editionId', payload->>'eventId', '2026'));
  if edition.id is null then
    return app_private.result('error', null, 'That edition is not open for RSVP.');
  end if;

  phone_norm := app_private.normalize_ng_phone(payload->>'phone');
  channel := coalesce(payload->>'preferredChannel', 'whatsapp');
  whatsapp_ok := coalesce((payload->>'whatsappConsent')::boolean, (payload->>'consentWhatsApp')::boolean, false);
  email_ok := coalesce((payload->>'emailConsent')::boolean, (payload->>'consentEmail')::boolean, false);

  if length(trim(coalesce(payload->>'firstName', ''))) < 2 then
    errors := errors || app_private.field_error('firstName', 'Enter your first name.');
  end if;
  if phone_norm is null then
    errors := errors || app_private.field_error('phone', 'Enter a valid Nigerian WhatsApp number.');
  end if;
  if channel <> 'whatsapp' and app_private.normalize_email(payload->>'email') is null then
    errors := errors || app_private.field_error('email', 'Email is required when email reminders are selected.');
  end if;
  if channel <> 'email' and not whatsapp_ok then
    errors := errors || app_private.field_error('whatsappConsent', 'Confirm WhatsApp reminders to continue.');
  end if;
  if channel <> 'whatsapp' and not email_ok then
    errors := errors || app_private.field_error('emailConsent', 'Confirm email reminders to continue.');
  end if;
  if errors <> '[]'::jsonb then
    return app_private.result('validation_error', null, null, errors);
  end if;

  select * into names from app_private.split_name(null, payload->>'firstName');
  contact := app_private.upsert_contact(
    names.first_name,
    names.last_name,
    payload->>'email',
    payload->>'phone',
    null,
    null,
    channel
  );

  if channel <> 'email' then
    perform app_private.set_consent(contact.id, 'event_reminders', 'whatsapp', whatsapp_ok, coalesce(payload->>'source', 'modal'));
  end if;
  if channel <> 'whatsapp' then
    perform app_private.set_consent(contact.id, 'event_reminders', 'email', email_ok, coalesce(payload->>'source', 'modal'));
  end if;

  select * into existing
  from public.rsvps
  where edition_id = edition.id and contact_id = contact.id;

  if existing.id is not null then
    update public.rsvps
    set response = 'attending', preferred_channel = channel, source = coalesce(payload->>'source', existing.source)
    where id = existing.id
    returning * into existing;
    return app_private.result('existing', app_private.rsvp_json(existing, edition.legacy_key));
  end if;

  insert into public.rsvps (edition_id, contact_id, response, source, preferred_channel)
  values (edition.id, contact.id, 'attending', coalesce(payload->>'source', 'modal'), channel)
  returning * into created;

  if whatsapp_ok then
    perform app_private.queue_message(
      edition.id, contact.id, 'whatsapp', 'rsvp_confirmation', contact.phone_normalized,
      jsonb_build_object('first_name', contact.first_name, 'event_name', edition.name)
    );
  end if;
  if email_ok and contact.email_normalized is not null then
    perform app_private.queue_message(
      edition.id, contact.id, 'email', 'rsvp_confirmation', contact.email_normalized,
      jsonb_build_object('first_name', contact.first_name, 'event_name', edition.name)
    );
  end if;

  return app_private.result('success', app_private.rsvp_json(created, edition.legacy_key));
end;
$$;

create or replace function app_private.decline_rsvp(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  edition public.event_editions;
begin
  edition := app_private.resolve_edition(coalesce(payload->>'editionId', payload->>'eventId', '2026'));
  if edition.id is null then
    return app_private.result('success', jsonb_build_object('recorded', true));
  end if;
  insert into public.rsvp_declines (edition_id, source)
  values (edition.id, coalesce(payload->>'source', 'modal'));
  return app_private.result('success', jsonb_build_object('recorded', true));
end;
$$;

create or replace function app_private.submit_volunteer(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  edition public.event_editions;
  team public.volunteer_teams;
  contact public.contacts;
  created public.volunteer_applications;
  existing public.volunteer_applications;
  phone_norm text;
  names record;
  errors jsonb := '[]'::jsonb;
begin
  if not app_private.enforce_rate_limit('volunteer', payload->>'ipHash') then
    return app_private.result('error', null, 'Too many attempts. Please wait a few minutes.');
  end if;

  edition := app_private.resolve_edition(coalesce(payload->>'eventId', payload->>'editionId', '2026'));
  if edition.id is null then
    return app_private.result('error', null, 'Volunteer applications are not open for that edition.');
  end if;

  phone_norm := app_private.normalize_ng_phone(payload->>'phone');
  if length(trim(coalesce(payload->>'fullName', ''))) < 3 then
    errors := errors || app_private.field_error('fullName', 'Enter your full name.');
  end if;
  if app_private.normalize_email(payload->>'email') is null then
    errors := errors || app_private.field_error('email', 'Enter a valid email address.');
  end if;
  if phone_norm is null then
    errors := errors || app_private.field_error('phone', 'Enter a valid WhatsApp number.');
  end if;
  if length(trim(coalesce(payload->>'occupation', ''))) < 2 then
    errors := errors || app_private.field_error('occupation', 'Tell us your occupation.');
  end if;
  if length(trim(coalesce(payload->>'location', ''))) < 2 then
    errors := errors || app_private.field_error('location', 'Tell us your location.');
  end if;
  if length(trim(coalesce(payload->>'experience', ''))) < 8 then
    errors := errors || app_private.field_error('experience', 'Share a little relevant experience.');
  end if;
  if length(trim(coalesce(payload->>'availability', ''))) < 4 then
    errors := errors || app_private.field_error('availability', 'Tell us when you can serve.');
  end if;
  if length(trim(coalesce(payload->>'motivation', ''))) < 12 then
    errors := errors || app_private.field_error('motivation', 'Tell us why you want to serve.');
  end if;
  if coalesce((payload->>'consentWhatsApp')::boolean, false) is not true
     or coalesce((payload->>'consentEmail')::boolean, false) is not true then
    errors := errors || app_private.field_error('consent', 'Application updates require WhatsApp and email consent.');
  end if;

  select * into team
  from public.volunteer_teams
  where edition_id = edition.id
    and (id::text = payload->>'teamId' or team_key = payload->>'teamId' or slug = payload->>'teamId')
  limit 1;

  if team.id is null then
    errors := errors || app_private.field_error('teamId', 'Choose a team.');
  end if;
  if errors <> '[]'::jsonb then
    return app_private.result('validation', null, null, errors);
  end if;

  select * into names from app_private.split_name(payload->>'fullName', null);
  contact := app_private.upsert_contact(
    names.first_name,
    names.last_name,
    payload->>'email',
    payload->>'phone',
    payload->>'occupation',
    payload->>'location',
    'both'
  );
  perform app_private.set_consent(contact.id, 'volunteer_updates', 'whatsapp', true, 'volunteer');
  perform app_private.set_consent(contact.id, 'volunteer_updates', 'email', true, 'volunteer');

  select * into existing
  from public.volunteer_applications
  where edition_id = edition.id and contact_id = contact.id;

  if existing.id is not null then
    return app_private.result('existing', jsonb_build_object(
      'id', existing.id,
      'eventId', edition.legacy_key,
      'contactId', existing.contact_id,
      'teamId', team.team_key,
      'experience', existing.experience,
      'availability', existing.availability,
      'motivation', existing.motivation,
      'occupation', existing.occupation,
      'location', existing.location,
      'status', existing.status,
      'reviewedBy', existing.reviewed_by,
      'reviewedAt', existing.reviewed_at,
      'createdAt', existing.created_at,
      'updatedAt', existing.updated_at
    ));
  end if;

  insert into public.volunteer_applications (
    edition_id, contact_id, team_id, experience, availability, motivation, occupation, location
  )
  values (
    edition.id, contact.id, team.id, payload->>'experience', payload->>'availability',
    payload->>'motivation', payload->>'occupation', payload->>'location'
  )
  returning * into created;

  perform app_private.queue_message(
    edition.id, contact.id, 'email', 'volunteer_receipt', contact.email_normalized,
    jsonb_build_object('first_name', contact.first_name, 'volunteer_team', team.name, 'event_name', edition.name)
  );
  perform app_private.queue_message(
    edition.id, contact.id, 'whatsapp', 'volunteer_receipt', contact.phone_normalized,
    jsonb_build_object('first_name', contact.first_name, 'volunteer_team', team.name, 'event_name', edition.name)
  );

  return app_private.result('success', jsonb_build_object(
    'id', created.id,
    'eventId', edition.legacy_key,
    'contactId', created.contact_id,
    'teamId', team.team_key,
    'experience', created.experience,
    'availability', created.availability,
    'motivation', created.motivation,
    'occupation', created.occupation,
    'location', created.location,
    'status', created.status,
    'reviewedBy', created.reviewed_by,
    'reviewedAt', created.reviewed_at,
    'createdAt', created.created_at,
    'updatedAt', created.updated_at
  ));
end;
$$;

create or replace function app_private.check_in_attendance(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  edition public.event_editions;
  contact public.contacts;
  existing public.attendance_records;
  created public.attendance_records;
  phone_norm text;
  names record;
  errors jsonb := '[]'::jsonb;
  source text := coalesce(payload->>'source', 'qr');
  window_ok boolean;
begin
  if not app_private.enforce_rate_limit('attendance', payload->>'ipHash') then
    return app_private.result('error', null, 'Too many attempts. Please wait a few minutes.');
  end if;

  edition := app_private.resolve_edition(coalesce(payload->>'eventId', payload->>'editionId', '2026'));
  if edition.id is null then
    return app_private.result('error', null, 'Check-in is not available for that edition.');
  end if;

  window_ok := edition.preview_check_in
    or (now() >= edition.attendance_window_starts_at and now() <= edition.attendance_window_ends_at)
    or source = 'admin';

  if not window_ok then
    return app_private.result(
      'outside_window',
      null,
      'Check-in is only open during the event window. Staff can record attendance from admin if needed.'
    );
  end if;

  phone_norm := app_private.normalize_ng_phone(payload->>'phone');
  if length(trim(coalesce(payload->>'fullName', ''))) < 3 then
    errors := errors || app_private.field_error('fullName', 'Enter your full name.');
  end if;
  if app_private.normalize_email(payload->>'email') is null then
    errors := errors || app_private.field_error('email', 'Enter a valid email address.');
  end if;
  if phone_norm is null then
    errors := errors || app_private.field_error('phone', 'Enter a valid WhatsApp number.');
  end if;
  if length(trim(coalesce(payload->>'occupation', ''))) < 2 then
    errors := errors || app_private.field_error('occupation', 'Enter your occupation.');
  end if;
  if coalesce((payload->>'consentAttendance')::boolean, false) is not true then
    errors := errors || app_private.field_error('consentAttendance', 'Confirm attendance recording to continue.');
  end if;
  if errors <> '[]'::jsonb then
    return app_private.result('validation', null, null, errors);
  end if;

  select * into names from app_private.split_name(payload->>'fullName', null);
  contact := app_private.upsert_contact(
    names.first_name,
    names.last_name,
    payload->>'email',
    payload->>'phone',
    payload->>'occupation',
    null,
    case when coalesce((payload->>'consentReminders')::boolean, false) then 'both' else 'email' end
  );

  if coalesce((payload->>'consentReminders')::boolean, false) then
    perform app_private.set_consent(contact.id, 'event_reminders', 'email', true, 'attendance');
    perform app_private.set_consent(contact.id, 'event_reminders', 'whatsapp', true, 'attendance');
  end if;

  select * into existing
  from public.attendance_records
  where edition_id = edition.id and contact_id = contact.id;

  if existing.id is not null then
    return app_private.result('duplicate', jsonb_build_object(
      'id', existing.id,
      'eventId', edition.legacy_key,
      'contactId', existing.contact_id,
      'checkedInAt', existing.checked_in_at,
      'source', existing.source,
      'occupationSnapshot', existing.occupation_snapshot,
      'deviceCategory', existing.device_category,
      'duplicateOfId', existing.id,
      'createdBy', existing.created_by
    ));
  end if;

  insert into public.attendance_records (
    edition_id, contact_id, source, occupation_snapshot, device_category, created_by
  )
  values (
    edition.id,
    contact.id,
    source,
    payload->>'occupation',
    coalesce(payload->>'deviceCategory', 'mobile'),
    nullif(payload->>'createdBy', '')::uuid
  )
  returning * into created;

  return app_private.result('success', jsonb_build_object(
    'id', created.id,
    'eventId', edition.legacy_key,
    'contactId', created.contact_id,
    'checkedInAt', created.checked_in_at,
    'source', created.source,
    'occupationSnapshot', created.occupation_snapshot,
    'deviceCategory', created.device_category,
    'duplicateOfId', created.duplicate_of_id,
    'createdBy', created.created_by
  ));
end;
$$;

create or replace function app_private.submit_enquiry(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.enquiries;
  errors jsonb := '[]'::jsonb;
begin
  if not app_private.enforce_rate_limit('enquiry', payload->>'ipHash') then
    return app_private.result('error', null, 'Too many attempts. Please wait a few minutes.');
  end if;
  if length(trim(coalesce(payload->>'name', ''))) < 2 then
    errors := errors || app_private.field_error('name', 'Enter your name.');
  end if;
  if app_private.normalize_email(payload->>'email') is null then
    errors := errors || app_private.field_error('email', 'Enter a valid email address.');
  end if;
  if length(trim(coalesce(payload->>'message', ''))) < 12 then
    errors := errors || app_private.field_error('message', 'Please write a little more so we can help.');
  end if;
  if errors <> '[]'::jsonb then
    return app_private.result('validation', null, null, errors);
  end if;

  insert into public.enquiries (name, email, phone, message)
  values (trim(payload->>'name'), app_private.normalize_email(payload->>'email'), payload->>'phone', trim(payload->>'message'))
  returning * into created;

  return app_private.result('success', jsonb_build_object('id', created.id));
end;
$$;

create or replace function app_private.unsubscribe_contact(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  phone_norm text;
  email_norm text;
  found public.contacts;
  channel text := coalesce(payload->>'channel', 'both');
begin
  phone_norm := app_private.normalize_ng_phone(payload->>'phone');
  email_norm := app_private.normalize_email(payload->>'email');
  if phone_norm is null and email_norm is null then
    return app_private.result('validation', null, null, jsonb_build_array(
      app_private.field_error('email', 'Provide an email address or WhatsApp number.')
    ));
  end if;

  select * into found
  from public.contacts
  where (phone_norm is not null and phone_normalized = phone_norm)
     or (email_norm is not null and email_normalized = email_norm)
  limit 1;

  if found.id is null then
    return app_private.result('success', jsonb_build_object('id', gen_random_uuid()));
  end if;

  if channel in ('whatsapp', 'both') then
    update public.contact_consents
    set status = 'revoked', revoked_at = now()
    where contact_id = found.id and channel = 'whatsapp' and status = 'granted';
  end if;
  if channel in ('email', 'both') then
    update public.contact_consents
    set status = 'revoked', revoked_at = now()
    where contact_id = found.id and channel = 'email' and status = 'granted';
  end if;

  return app_private.result('success', jsonb_build_object('id', found.id));
end;
$$;

create or replace function public.submit_rsvp(payload jsonb)
returns jsonb language sql security invoker set search_path = public
as $$ select app_private.submit_rsvp(payload); $$;

create or replace function public.decline_rsvp(payload jsonb)
returns jsonb language sql security invoker set search_path = public
as $$ select app_private.decline_rsvp(payload); $$;

create or replace function public.submit_volunteer(payload jsonb)
returns jsonb language sql security invoker set search_path = public
as $$ select app_private.submit_volunteer(payload); $$;

create or replace function public.check_in_attendance(payload jsonb)
returns jsonb language sql security invoker set search_path = public
as $$ select app_private.check_in_attendance(payload); $$;

create or replace function public.submit_enquiry(payload jsonb)
returns jsonb language sql security invoker set search_path = public
as $$ select app_private.submit_enquiry(payload); $$;

create or replace function public.unsubscribe_contact(payload jsonb)
returns jsonb language sql security invoker set search_path = public
as $$ select app_private.unsubscribe_contact(payload); $$;

grant execute on function app_private.submit_rsvp(jsonb) to anon, authenticated;
grant execute on function app_private.decline_rsvp(jsonb) to anon, authenticated;
grant execute on function app_private.submit_volunteer(jsonb) to anon, authenticated;
grant execute on function app_private.check_in_attendance(jsonb) to anon, authenticated;
grant execute on function app_private.submit_enquiry(jsonb) to anon, authenticated;
grant execute on function app_private.unsubscribe_contact(jsonb) to anon, authenticated;
grant execute on function public.submit_rsvp(jsonb) to anon, authenticated;
grant execute on function public.decline_rsvp(jsonb) to anon, authenticated;
grant execute on function public.submit_volunteer(jsonb) to anon, authenticated;
grant execute on function public.check_in_attendance(jsonb) to anon, authenticated;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated;
grant execute on function public.unsubscribe_contact(jsonb) to anon, authenticated;
