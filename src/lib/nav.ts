export const publicNav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/experience/2026", label: "Experience" },
  { href: "/flyer", label: "Flyer" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/polo", label: "Merch" },
  { href: "/insights", label: "Insights" },
  { href: "/gallery", label: "Gallery" },
] as const;

export const footerNav = {
  visit: [
    { href: "/experience/2026", label: "2026 experience" },
    { href: "/experience/2026/ministers", label: "Ministers" },
    { href: "/experience/2026/faq", label: "FAQ" },
    { href: "/flyer", label: "Attending flyer" },
    { href: "/polo", label: "Polo merch" },
    { href: "/experiences", label: "Previous editions" },
  ],
  serve: [
    { href: "/volunteer", label: "Volunteer" },
    { href: "/insights", label: "Insights" },
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

export const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/audience", label: "Audience" },
  { href: "/admin/rsvps", label: "RSVPs" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/flyer", label: "Flyer" },
  { href: "/admin/volunteers", label: "Volunteers" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/automations", label: "Automations" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit", label: "Audit" },
] as const;
