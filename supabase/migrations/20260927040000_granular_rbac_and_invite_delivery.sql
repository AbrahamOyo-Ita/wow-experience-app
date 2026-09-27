-- Enforce the admin role matrix in Postgres and retain invitation delivery state.

alter table public.team_invitations
  add column if not exists delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'delivered', 'failed', 'skipped', 'bounced', 'complained')),
  add column if not exists provider_message_id text,
  add column if not exists last_error text,
  add column if not exists last_sent_at timestamptz,
  add column if not exists accepted_at timestamptz;

-- An administrator has exactly one effective role. Keep the highest existing
-- role if old data contains more than one, then make future upserts deterministic.
delete from public.profile_roles lower_role
using public.profile_roles higher_role
where lower_role.profile_id = higher_role.profile_id
  and lower_role.role <> higher_role.role
  and case lower_role.role
    when 'super_admin' then 1 when 'event_admin' then 2
    when 'communications_manager' then 3 when 'content_editor' then 4
    when 'workforce_coordinator' then 5 when 'scanner_usher' then 6 else 99
  end > case higher_role.role
    when 'super_admin' then 1 when 'event_admin' then 2
    when 'communications_manager' then 3 when 'content_editor' then 4
    when 'workforce_coordinator' then 5 when 'scanner_usher' then 6 else 99
  end;

alter table public.profile_roles drop constraint if exists profile_roles_pkey;
alter table public.profile_roles add constraint profile_roles_pkey primary key (profile_id);

create or replace function app_private.has_permission(target_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles r
    join public.profiles p on p.id = r.profile_id
    where r.profile_id = (select auth.uid())
      and p.status = 'active'
      and case r.role
        when 'super_admin' then true
        when 'event_admin' then target_permission = any (array[
          'dashboard.view', 'events.manage', 'audience.view', 'rsvps.view',
          'attendance.manage', 'volunteers.manage', 'team.invite',
          'campaigns.manage', 'automations.manage', 'analytics.view', 'profile.update'
        ])
        when 'communications_manager' then target_permission = any (array[
          'dashboard.view', 'audience.view', 'campaigns.manage', 'templates.manage',
          'automations.manage', 'analytics.view', 'profile.update'
        ])
        when 'content_editor' then target_permission = any (array[
          'dashboard.view', 'content.manage', 'flyer.manage', 'profile.update'
        ])
        when 'workforce_coordinator' then target_permission = any (array[
          'dashboard.view', 'attendance.manage', 'volunteers.manage', 'profile.update'
        ])
        when 'scanner_usher' then target_permission = any (array[
          'dashboard.view', 'attendance.manage', 'profile.update'
        ])
        else false
      end
  );
$$;

revoke all on function app_private.has_permission(text) from public, anon;
grant execute on function app_private.has_permission(text) to authenticated, service_role;

-- Profiles and role assignments.
drop policy if exists "admins_read_profiles" on public.profiles;
create policy "authorized_read_profiles" on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select app_private.has_permission('team.invite'))
);

drop policy if exists "admins_read_roles" on public.profile_roles;
create policy "authorized_read_roles" on public.profile_roles for select to authenticated
using (
  profile_id = (select auth.uid())
  or (select app_private.has_permission('team.invite'))
);

drop policy if exists "super_admins_write_roles" on public.profile_roles;
create policy "super_admins_write_roles" on public.profile_roles for all to authenticated
using ((select app_private.has_permission('team.manage')))
with check ((select app_private.has_permission('team.manage')));

drop policy if exists "team_invitations_admin_all" on public.team_invitations;
create policy "authorized_team_invitations" on public.team_invitations for all to authenticated
using ((select app_private.has_permission('team.invite')))
with check ((select app_private.has_permission('team.invite')));

-- Event configuration.
drop policy if exists "public_read_published_editions" on public.event_editions;
create policy "public_read_published_editions" on public.event_editions for select to anon, authenticated
using (status in ('published', 'live', 'completed', 'archived') or (select app_private.has_permission('events.manage')));
drop policy if exists "admins_write_editions" on public.event_editions;
create policy "authorized_write_editions" on public.event_editions for all to authenticated
using ((select app_private.has_permission('events.manage')))
with check ((select app_private.has_permission('events.manage')));

drop policy if exists "admins_write_teams" on public.volunteer_teams;
create policy "authorized_write_teams" on public.volunteer_teams for all to authenticated
using ((select app_private.has_permission('events.manage')) or (select app_private.has_permission('volunteers.manage')))
with check ((select app_private.has_permission('events.manage')) or (select app_private.has_permission('volunteers.manage')));

drop policy if exists "public_read_open_teams" on public.volunteer_teams;
create policy "public_read_open_teams" on public.volunteer_teams for select to anon, authenticated
using (
  status = 'open'
  and exists (
    select 1 from public.event_editions e
    where e.id = volunteer_teams.edition_id
      and e.status in ('published', 'live', 'completed', 'archived')
  )
  or (select app_private.has_permission('events.manage'))
  or (select app_private.has_permission('volunteers.manage'))
);

-- Audience and RSVP data.
drop policy if exists "admins_select_contacts" on public.contacts;
create policy "authorized_select_contacts" on public.contacts for select to authenticated
using ((select app_private.has_permission('audience.view')) or (select app_private.has_permission('rsvps.view')) or (select app_private.has_permission('attendance.manage')) or (select app_private.has_permission('volunteers.manage')));
drop policy if exists "admins_update_contacts" on public.contacts;
create policy "authorized_update_contacts" on public.contacts for update to authenticated
using ((select app_private.has_permission('audience.view')))
with check ((select app_private.has_permission('audience.view')));

drop policy if exists "admins_select_consents" on public.contact_consents;
create policy "authorized_select_consents" on public.contact_consents for select to authenticated
using ((select app_private.has_permission('audience.view')) or (select app_private.has_permission('campaigns.manage')));
drop policy if exists "admins_update_consents" on public.contact_consents;
create policy "authorized_update_consents" on public.contact_consents for update to authenticated
using ((select app_private.has_permission('audience.view')))
with check ((select app_private.has_permission('audience.view')));

drop policy if exists "admins_select_enquiries" on public.enquiries;
create policy "authorized_select_enquiries" on public.enquiries for select to authenticated
using ((select app_private.has_permission('audience.view')));

drop policy if exists "admins_select_rsvps" on public.rsvps;
create policy "authorized_select_rsvps" on public.rsvps for select to authenticated
using ((select app_private.has_permission('rsvps.view')) or (select app_private.has_permission('attendance.manage')));
drop policy if exists "admins_select_declines" on public.rsvp_declines;
create policy "authorized_select_declines" on public.rsvp_declines for select to authenticated
using ((select app_private.has_permission('rsvps.view')));

-- Attendance and workforce.
drop policy if exists "admins_select_attendance" on public.attendance_records;
create policy "authorized_select_attendance" on public.attendance_records for select to authenticated
using ((select app_private.has_permission('attendance.manage')));
drop policy if exists "admins_insert_attendance" on public.attendance_records;
create policy "authorized_insert_attendance" on public.attendance_records for insert to authenticated
with check ((select app_private.has_permission('attendance.manage')));

drop policy if exists "admins_select_volunteers" on public.volunteer_applications;
create policy "authorized_select_volunteers" on public.volunteer_applications for select to authenticated
using ((select app_private.has_permission('volunteers.manage')));
drop policy if exists "admins_update_volunteers" on public.volunteer_applications;
create policy "authorized_update_volunteers" on public.volunteer_applications for update to authenticated
using ((select app_private.has_permission('volunteers.manage')))
with check ((select app_private.has_permission('volunteers.manage')));

-- Communications.
drop policy if exists "admins_all_templates" on public.message_templates;
create policy "authorized_all_templates" on public.message_templates for all to authenticated
using ((select app_private.has_permission('templates.manage')))
with check ((select app_private.has_permission('templates.manage')));
drop policy if exists "admins_all_campaigns" on public.campaigns;
create policy "authorized_all_campaigns" on public.campaigns for all to authenticated
using ((select app_private.has_permission('campaigns.manage')))
with check ((select app_private.has_permission('campaigns.manage')));
drop policy if exists "admins_all_automations" on public.automation_rules;
create policy "authorized_all_automations" on public.automation_rules for all to authenticated
using ((select app_private.has_permission('automations.manage')))
with check ((select app_private.has_permission('automations.manage')));

drop policy if exists "admins_all_newsletter_subscribers" on public.newsletter_subscribers;
create policy "authorized_all_newsletter_subscribers" on public.newsletter_subscribers for all to authenticated
using ((select app_private.has_permission('campaigns.manage')))
with check ((select app_private.has_permission('campaigns.manage')));
drop policy if exists "admins_all_newsletters" on public.newsletters;
create policy "authorized_all_newsletters" on public.newsletters for all to authenticated
using ((select app_private.has_permission('campaigns.manage')) or (select app_private.has_permission('content.manage')))
with check ((select app_private.has_permission('campaigns.manage')) or (select app_private.has_permission('content.manage')));
drop policy if exists "public_read_published_newsletters" on public.newsletters;
create policy "public_read_published_newsletters" on public.newsletters for select to anon, authenticated
using (
  status = 'published'
  or (select app_private.has_permission('campaigns.manage'))
  or (select app_private.has_permission('content.manage'))
);

drop policy if exists "admins_select_notifications" on public.notifications;
create policy "authorized_select_notifications" on public.notifications for select to authenticated
using ((select app_private.has_permission('campaigns.manage')) or (select app_private.has_permission('automations.manage')));
drop policy if exists "admins_select_attempts" on public.notification_attempts;
create policy "authorized_select_attempts" on public.notification_attempts for select to authenticated
using ((select app_private.has_permission('campaigns.manage')) or (select app_private.has_permission('automations.manage')));

-- Content.
drop policy if exists "admins_insert_ministers" on public.ministers;
drop policy if exists "admins_update_ministers" on public.ministers;
drop policy if exists "admins_delete_ministers" on public.ministers;
create policy "authorized_insert_ministers" on public.ministers for insert to authenticated with check ((select app_private.has_permission('content.manage')));
create policy "authorized_update_ministers" on public.ministers for update to authenticated using ((select app_private.has_permission('content.manage'))) with check ((select app_private.has_permission('content.manage')));
create policy "authorized_delete_ministers" on public.ministers for delete to authenticated using ((select app_private.has_permission('content.manage')));
drop policy if exists "public_read_published_ministers" on public.ministers;
create policy "public_read_published_ministers" on public.ministers for select to anon, authenticated
using (is_published or (select app_private.has_permission('content.manage')));

drop policy if exists "admins_all_articles" on public.articles;
create policy "authorized_all_articles" on public.articles for all to authenticated
using ((select app_private.has_permission('content.manage')))
with check ((select app_private.has_permission('content.manage')));
drop policy if exists "admins_all_faqs" on public.faqs;
create policy "authorized_all_faqs" on public.faqs for all to authenticated
using ((select app_private.has_permission('content.manage')))
with check ((select app_private.has_permission('content.manage')));

drop policy if exists "admins_read_all_flyer_templates" on public.flyer_templates;
drop policy if exists "admins_insert_flyer_templates" on public.flyer_templates;
drop policy if exists "admins_update_flyer_templates" on public.flyer_templates;
drop policy if exists "admins_delete_flyer_templates" on public.flyer_templates;
create policy "authorized_read_flyer_templates" on public.flyer_templates for select to authenticated using ((select app_private.has_permission('flyer.manage')));
create policy "authorized_insert_flyer_templates" on public.flyer_templates for insert to authenticated with check ((select app_private.has_permission('flyer.manage')));
create policy "authorized_update_flyer_templates" on public.flyer_templates for update to authenticated using ((select app_private.has_permission('flyer.manage'))) with check ((select app_private.has_permission('flyer.manage')));
create policy "authorized_delete_flyer_templates" on public.flyer_templates for delete to authenticated using ((select app_private.has_permission('flyer.manage')));

-- Operations, settings, and audit.
drop policy if exists "admins_all_whatsapp" on public.whatsapp_sessions;
create policy "authorized_all_whatsapp" on public.whatsapp_sessions for all to authenticated
using ((select app_private.has_permission('settings.manage')) or (select app_private.has_permission('campaigns.manage')))
with check ((select app_private.has_permission('settings.manage')) or (select app_private.has_permission('campaigns.manage')));
drop policy if exists "admins_select_audit" on public.audit_logs;
create policy "authorized_select_audit" on public.audit_logs for select to authenticated
using ((select app_private.has_permission('audit.view')));
drop policy if exists "admins_insert_audit" on public.audit_logs;
create policy "authorized_insert_audit" on public.audit_logs for insert to authenticated
with check ((select app_private.has_permission('dashboard.view')));

-- Preserve the existing aggregate implementation behind a permission-aware
-- wrapper so direct RPC calls cannot bypass the application route guard.
alter function public.get_analytics_dashboard(integer) rename to get_analytics_dashboard_unchecked;
revoke all on function public.get_analytics_dashboard_unchecked(integer) from public, anon, authenticated;
create function public.get_analytics_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select app_private.has_permission('analytics.view')) then
    raise exception 'Analytics access required' using errcode = '42501';
  end if;
  return public.get_analytics_dashboard_unchecked(p_days);
end;
$$;
revoke all on function public.get_analytics_dashboard(integer) from public, anon;
grant execute on function public.get_analytics_dashboard(integer) to authenticated;

-- Storage object policies must mirror the table permissions.
drop policy if exists "admins_upload_minister_images" on storage.objects;
drop policy if exists "admins_delete_minister_images" on storage.objects;
create policy "authorized_upload_minister_images" on storage.objects for insert to authenticated
with check (bucket_id = 'minister-images' and (select app_private.has_permission('content.manage')));
create policy "authorized_delete_minister_images" on storage.objects for delete to authenticated
using (bucket_id = 'minister-images' and (select app_private.has_permission('content.manage')));

drop policy if exists "admins_upload_article_covers" on storage.objects;
drop policy if exists "admins_delete_article_covers" on storage.objects;
create policy "authorized_upload_article_covers" on storage.objects for insert to authenticated
with check (bucket_id = 'article-covers' and (select app_private.has_permission('content.manage')));
create policy "authorized_delete_article_covers" on storage.objects for delete to authenticated
using (bucket_id = 'article-covers' and (select app_private.has_permission('content.manage')));

drop policy if exists "admins_upload_flyer_templates" on storage.objects;
drop policy if exists "admins_update_flyer_templates" on storage.objects;
drop policy if exists "admins_delete_flyer_templates" on storage.objects;
create policy "authorized_upload_flyer_templates" on storage.objects for insert to authenticated
with check (bucket_id = 'flyer-templates' and (select app_private.has_permission('flyer.manage')));
create policy "authorized_update_flyer_templates" on storage.objects for update to authenticated
using (bucket_id = 'flyer-templates' and (select app_private.has_permission('flyer.manage')))
with check (bucket_id = 'flyer-templates' and (select app_private.has_permission('flyer.manage')));
create policy "authorized_delete_flyer_templates" on storage.objects for delete to authenticated
using (bucket_id = 'flyer-templates' and (select app_private.has_permission('flyer.manage')));
