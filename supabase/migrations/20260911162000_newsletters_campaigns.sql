alter table public.contact_consents
  drop constraint if exists contact_consents_purpose_check;

alter table public.contact_consents
  add constraint contact_consents_purpose_check
  check (purpose in ('event_reminders', 'volunteer_updates', 'enquiry', 'attendance', 'newsletter'));

alter table public.campaigns
  add column if not exists target_contact_ids uuid[] not null default '{}',
  add column if not exists attachments jsonb not null default '[]'::jsonb;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  name text,
  status text not null default 'granted' check (status in ('granted', 'revoked')),
  source text not null default 'footer',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subject text not null,
  excerpt text not null default '',
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists newsletter_subscribers_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_updated_at before update on public.newsletter_subscribers
for each row execute function app_private.set_updated_at();

drop trigger if exists newsletters_updated_at on public.newsletters;
create trigger newsletters_updated_at before update on public.newsletters
for each row execute function app_private.set_updated_at();

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletters enable row level security;

drop policy if exists "admins_all_newsletter_subscribers" on public.newsletter_subscribers;
create policy "admins_all_newsletter_subscribers"
on public.newsletter_subscribers for all to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "admins_all_newsletters" on public.newsletters;
create policy "admins_all_newsletters"
on public.newsletters for all to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "public_read_published_newsletters" on public.newsletters;
create policy "public_read_published_newsletters"
on public.newsletters for select to anon, authenticated
using (status = 'published' or app_private.is_admin());

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status, subscribed_at);

create index if not exists newsletters_status_published_idx
  on public.newsletters (status, published_at);

create or replace function app_private.newsletter_subscriber_json(p_subscriber public.newsletter_subscribers)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', p_subscriber.id,
    'email', p_subscriber.email,
    'emailNormalized', p_subscriber.email_normalized,
    'name', p_subscriber.name,
    'status', p_subscriber.status,
    'source', p_subscriber.source,
    'subscribedAt', p_subscriber.subscribed_at,
    'unsubscribedAt', p_subscriber.unsubscribed_at
  );
$$;

create or replace function app_private.subscribe_newsletter(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  email_norm text;
  existing public.newsletter_subscribers;
  created public.newsletter_subscribers;
begin
  if not app_private.enforce_rate_limit('newsletter', payload->>'ipHash') then
    return app_private.result('error', null, 'Too many attempts. Please wait a few minutes.');
  end if;

  email_norm := app_private.normalize_email(payload->>'email');
  if email_norm is null then
    return app_private.result('validation', null, null, jsonb_build_array(
      app_private.field_error('email', 'Enter a valid email address.')
    ));
  end if;

  select * into existing
  from public.newsletter_subscribers
  where email_normalized = email_norm
  limit 1;

  if existing.id is not null then
    update public.newsletter_subscribers
    set
      email = email_norm,
      name = coalesce(nullif(trim(payload->>'name'), ''), existing.name),
      status = 'granted',
      source = coalesce(nullif(payload->>'source', ''), existing.source),
      subscribed_at = case when existing.status = 'revoked' then now() else existing.subscribed_at end,
      unsubscribed_at = null
    where id = existing.id
    returning * into existing;
    return app_private.result('existing', app_private.newsletter_subscriber_json(existing));
  end if;

  insert into public.newsletter_subscribers (email, email_normalized, name, source)
  values (
    email_norm,
    email_norm,
    nullif(trim(payload->>'name'), ''),
    coalesce(nullif(payload->>'source', ''), 'footer')
  )
  returning * into created;

  return app_private.result('success', app_private.newsletter_subscriber_json(created));
end;
$$;

create or replace function public.subscribe_newsletter(payload jsonb)
returns jsonb language sql security invoker set search_path = public
as $$ select app_private.subscribe_newsletter(payload); $$;

grant execute on function app_private.subscribe_newsletter(jsonb) to anon, authenticated;
grant execute on function public.subscribe_newsletter(jsonb) to anon, authenticated;
grant select on public.newsletters to anon, authenticated;
grant select on public.newsletter_subscribers to authenticated;
grant insert, update on public.newsletters to authenticated;
grant update on public.campaigns to authenticated;
