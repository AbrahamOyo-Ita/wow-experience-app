create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempt_count integer not null default 0,
  last_error text,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists campaign_recipients_campaign_idx
  on public.campaign_recipients (campaign_id, status, id);
create index if not exists campaign_recipients_email_idx
  on public.campaign_recipients (email);
create unique index if not exists campaign_recipients_campaign_recipient_idx
  on public.campaign_recipients (campaign_id, coalesce(contact_id::text, lower(email)));

alter table public.campaign_recipients enable row level security;
drop policy if exists "admins_select_campaign_recipients" on public.campaign_recipients;
create policy "admins_select_campaign_recipients"
  on public.campaign_recipients for select to authenticated
  using (app_private.is_admin());

grant select on public.campaign_recipients to authenticated;
grant all on public.campaign_recipients to service_role;
