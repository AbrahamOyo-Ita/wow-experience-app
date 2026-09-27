export const publicNav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/flyer", label: "Flyer" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/polo", label: "Merch" },
  { href: "/gallery", label: "Gallery" },
] as const;

export const footerNav = {
  visit: [
    { href: "/flyer", label: "Attending flyer" },
    { href: "/polo", label: "Polo merch" },
    { href: "/gallery", label: "Gallery" },
    { href: "/volunteer", label: "Volunteer" },
  ],
  serve: [
    { href: "/volunteer", label: "Volunteer" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/unsubscribe", label: "Unsubscribe" },
    { href: "/admin", label: "Admin" },
  ],
} as const;

import type { AdminPermission } from "@/lib/admin-rbac";

export const adminNav: ReadonlyArray<{ href: string; label: string; permission: AdminPermission }> = [
  { href: "/admin", label: "Overview", permission: "dashboard.view" },
  { href: "/admin/events", label: "Events", permission: "events.manage" },
  { href: "/admin/audience", label: "Audience", permission: "audience.view" },
  { href: "/admin/rsvps", label: "RSVPs", permission: "rsvps.view" },
  { href: "/admin/attendance", label: "Attendance", permission: "attendance.manage" },
  { href: "/admin/flyer", label: "Flyer", permission: "flyer.manage" },
  { href: "/admin/volunteers", label: "Volunteers", permission: "volunteers.manage" },
  { href: "/admin/team", label: "Team & RBAC", permission: "team.invite" },
  { href: "/admin/campaigns", label: "Campaigns", permission: "campaigns.manage" },
  { href: "/admin/templates", label: "Templates", permission: "templates.manage" },
  { href: "/admin/automations", label: "Automations", permission: "automations.manage" },
  { href: "/admin/content", label: "Content", permission: "content.manage" },
  { href: "/admin/analytics", label: "Analytics", permission: "analytics.view" },
  { href: "/admin/settings", label: "Settings", permission: "settings.manage" },
  { href: "/admin/audit", label: "Audit", permission: "audit.view" },
] as const;
