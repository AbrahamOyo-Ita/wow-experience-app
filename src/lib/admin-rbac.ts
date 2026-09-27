import type { AdminRole } from "@/types";

export type AdminPermission =
  | "dashboard.view"
  | "events.manage"
  | "audience.view"
  | "rsvps.view"
  | "attendance.manage"
  | "volunteers.manage"
  | "team.invite"
  | "team.manage"
  | "campaigns.manage"
  | "templates.manage"
  | "automations.manage"
  | "content.manage"
  | "flyer.manage"
  | "analytics.view"
  | "settings.manage"
  | "audit.view"
  | "profile.update";

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: [
    "dashboard.view", "events.manage", "audience.view", "rsvps.view",
    "attendance.manage", "volunteers.manage", "team.invite", "team.manage",
    "campaigns.manage", "templates.manage", "automations.manage", "content.manage",
    "flyer.manage", "analytics.view", "settings.manage", "audit.view", "profile.update",
  ],
  event_admin: [
    "dashboard.view", "events.manage", "audience.view", "rsvps.view",
    "attendance.manage", "volunteers.manage", "team.invite", "campaigns.manage",
    "automations.manage", "analytics.view", "profile.update",
  ],
  communications_manager: [
    "dashboard.view", "audience.view", "campaigns.manage", "templates.manage",
    "automations.manage", "analytics.view", "profile.update",
  ],
  content_editor: [
    "dashboard.view", "content.manage", "flyer.manage", "profile.update",
  ],
  workforce_coordinator: [
    "dashboard.view", "attendance.manage", "volunteers.manage", "profile.update",
  ],
  scanner_usher: ["dashboard.view", "attendance.manage", "profile.update"],
};

const ROUTE_PERMISSIONS: ReadonlyArray<readonly [string, AdminPermission]> = [
  ["/admin/team", "team.invite"],
  ["/admin/settings", "settings.manage"],
  ["/admin/audit", "audit.view"],
  ["/admin/events", "events.manage"],
  ["/admin/audience", "audience.view"],
  ["/admin/rsvps", "rsvps.view"],
  ["/admin/attendance", "attendance.manage"],
  ["/admin/volunteers", "volunteers.manage"],
  ["/admin/campaigns", "campaigns.manage"],
  ["/admin/templates", "templates.manage"],
  ["/admin/automations", "automations.manage"],
  ["/admin/content", "content.manage"],
  ["/admin/flyer", "flyer.manage"],
  ["/admin/analytics", "analytics.view"],
  ["/admin", "dashboard.view"],
];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && value in ROLE_PERMISSIONS;
}

export function hasAdminPermission(role: AdminRole, permission: AdminPermission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionForAdminPath(pathname: string): AdminPermission | null {
  return ROUTE_PERMISSIONS.find(
    ([path]) => pathname === path || (path !== "/admin" && pathname.startsWith(`${path}/`)),
  )?.[1] ?? null;
}

export function canAccessAdminPath(role: AdminRole, pathname: string) {
  const permission = permissionForAdminPath(pathname);
  return permission ? hasAdminPermission(role, permission) : false;
}

