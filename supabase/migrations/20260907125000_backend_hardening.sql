create or replace function app_private.jsonb_bool(
  payload jsonb,
  key text,
  default_value boolean default false
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case lower(coalesce(payload->>key, ''))
    when 'true' then true
    when 't' then true
    when '1' then true
    when 'yes' then true
    when 'on' then true
    when 'false' then false
    when 'f' then false
    when '0' then false
    when 'no' then false
    when 'off' then false
    else default_value
  end;
$$;

create or replace function app_private.upsert_contact_safe(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_occupation text,
  p_location text,
  p_preferred_channel text
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
  phone_norm := app_private.normalize_ng_phone(p_phone);
  email_norm := app_private.normalize_email(p_email);

  select * into found
  from public.contacts
  where phone_normalized = phone_norm
     or (email_norm is not null and email_normalized = email_norm)
  order by created_at
  limit 1;

  if found.id is not null then
    update public.contacts
    set
      first_name = coalesce(nullif(p_first_name, ''), found.first_name),
      last_name = case when coalesce(p_last_name, '') <> '' then p_last_name else found.last_name end,
      email = coalesce(p_email, found.email),
      email_normalized = coalesce(email_norm, found.email_normalized),
      phone = phone_norm,
      phone_normalized = phone_norm,
      occupation = coalesce(p_occupation, found.occupation),
      location = coalesce(p_location, found.location),
      preferred_channel = p_preferred_channel
    where id = found.id
    returning * into found;
    return found;
  end if;

  insert into public.contacts (
    first_name, last_name, email, email_normalized, phone, phone_normalized,
    occupation, location, preferred_channel
  )
  values (
    p_first_name,
    coalesce(p_last_name, ''),
    p_email,
    email_norm,
    phone_norm,
    phone_norm,
    p_occupation,
    p_location,
    p_preferred_channel
  )
  returning * into found;
  return found;
end;
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
  whatsapp_ok := app_private.jsonb_bool(payload, 'whatsappConsent', app_private.jsonb_bool(payload, 'consentWhatsApp', false));
  email_ok := app_private.jsonb_bool(payload, 'emailConsent', app_private.jsonb_bool(payload, 'consentEmail', false));

  if length(trim(coalesce(payload->>'firstName', ''))) < 2 then
    errors := errors || app_private.field_error('firstName', 'Enter your first name.');
  end if;
  if phone_norm is null then
    errors := errors || app_private.field_error('phone', 'Enter a valid Nigerian WhatsApp number.');
  end if;
  if channel not in ('whatsapp', 'email', 'both') then
    errors := errors || app_private.field_error('preferredChannel', 'Choose a valid reminder channel.');
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
  contact := app_private.upsert_contact_safe(
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
  if not app_private.jsonb_bool(payload, 'consentWhatsApp', false)
     or not app_private.jsonb_bool(payload, 'consentEmail', false) then
    errors := errors || app_private.field_error('consent', 'Application updates require WhatsApp and email consent.');
  end if;

  select * into team
  from public.volunteer_teams
  where edition_id = edition.id
    and status = 'open'
    and (id::text = payload->>'teamId' or team_key = payload->>'teamId' or slug = payload->>'teamId')
  limit 1;

  if team.id is null then
    errors := errors || app_private.field_error('teamId', 'Choose an open team.');
  end if;
  if errors <> '[]'::jsonb then
    return app_private.result('validation', null, null, errors);
  end if;

  select * into names from app_private.split_name(payload->>'fullName', null);
  contact := app_private.upsert_contact_safe(
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
  if not app_private.jsonb_bool(payload, 'consentAttendance', false) then
    errors := errors || app_private.field_error('consentAttendance', 'Confirm attendance recording to continue.');
  end if;
  if errors <> '[]'::jsonb then
    return app_private.result('validation', null, null, errors);
  end if;

  select * into names from app_private.split_name(payload->>'fullName', null);
  contact := app_private.upsert_contact_safe(
    names.first_name,
    names.last_name,
    payload->>'email',
    payload->>'phone',
    payload->>'occupation',
    null,
    case when app_private.jsonb_bool(payload, 'consentReminders', false) then 'both' else 'email' end
  );

  if app_private.jsonb_bool(payload, 'consentReminders', false) then
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

grant usage on schema public to anon, authenticated;
grant select on public.event_editions, public.volunteer_teams to anon, authenticated;
grant select on
  public.profiles,
  public.profile_roles,
  public.contacts,
  public.contact_consents,
  public.rsvps,
  public.rsvp_declines,
  public.attendance_records,
  public.volunteer_applications,
  public.enquiries,
  public.message_templates,
  public.campaigns,
  public.automation_rules,
  public.notifications,
  public.notification_attempts,
  public.whatsapp_sessions,
  public.audit_logs
to authenticated;
grant update on
  public.contacts,
  public.contact_consents,
  public.volunteer_applications,
  public.automation_rules,
  public.event_editions
to authenticated;
grant insert on
  public.attendance_records,
  public.campaigns,
  public.audit_logs
to authenticated;

create index if not exists profile_roles_profile_id_idx on public.profile_roles (profile_id);
create index if not exists volunteer_teams_edition_id_idx on public.volunteer_teams (edition_id);
create index if not exists contact_consents_contact_id_idx on public.contact_consents (contact_id);
create index if not exists rsvps_edition_id_idx on public.rsvps (edition_id);
create index if not exists rsvps_contact_id_idx on public.rsvps (contact_id);
create index if not exists rsvp_declines_edition_id_idx on public.rsvp_declines (edition_id);
create index if not exists attendance_records_edition_id_idx on public.attendance_records (edition_id);
create index if not exists attendance_records_contact_id_idx on public.attendance_records (contact_id);
create index if not exists volunteer_applications_edition_id_idx on public.volunteer_applications (edition_id);
create index if not exists volunteer_applications_contact_id_idx on public.volunteer_applications (contact_id);
create index if not exists volunteer_applications_team_id_idx on public.volunteer_applications (team_id);
create index if not exists message_templates_edition_id_idx on public.message_templates (edition_id);
create index if not exists campaigns_edition_id_idx on public.campaigns (edition_id);
create index if not exists automation_rules_edition_id_idx on public.automation_rules (edition_id);
create index if not exists notifications_edition_id_idx on public.notifications (edition_id);
create index if not exists notifications_contact_id_idx on public.notifications (contact_id);
create index if not exists notifications_campaign_id_idx on public.notifications (campaign_id);
create index if not exists notification_attempts_notification_id_idx on public.notification_attempts (notification_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
