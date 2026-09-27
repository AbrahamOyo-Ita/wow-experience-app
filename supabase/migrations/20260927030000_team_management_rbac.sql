-- Team Management and Super Senior RBAC Migration
-- WOW Experience 2026

-- 1. Upgrade check constraint on profile_roles to support 6 granular roles
do $$
begin
  alter table public.profile_roles drop constraint if exists profile_roles_role_check;
  alter table public.profile_roles add constraint profile_roles_role_check
    check (role in ('super_admin', 'event_admin', 'communications_manager', 'content_editor', 'workforce_coordinator', 'scanner_usher'));
exception
  when others then null;
end $$;

-- 2. Enhance public.profiles with department, status, and metadata
alter table public.profiles add column if not exists department text not null default 'Executive Leadership';
alter table public.profiles add column if not exists phone text default '';
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists invited_by uuid references auth.users (id) on delete set null;
alter table public.profiles add column if not exists last_sign_in_at timestamptz;

-- 3. Create team_invitations table
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('super_admin', 'event_admin', 'communications_manager', 'content_editor', 'workforce_coordinator', 'scanner_usher')),
  department text not null default 'General',
  invited_by_id uuid references auth.users (id) on delete set null,
  invited_by_name text not null default 'Super Admin',
  token text not null unique,
  invite_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists team_invitations_email_idx on public.team_invitations (email);
create index if not exists team_invitations_status_idx on public.team_invitations (status);
create index if not exists team_invitations_token_idx on public.team_invitations (token);

-- Row Level Security
alter table public.team_invitations enable row level security;

drop policy if exists "team_invitations_admin_all" on public.team_invitations;
create policy "team_invitations_admin_all"
  on public.team_invitations
  for all
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

grant select, insert, update, delete on public.team_invitations to authenticated, service_role;
