"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileText,
  ImageUp,
  HeartHandshake,
  LayoutGrid,
  Menu,
  Newspaper,
  ScanLine,
  ScrollText,
  Search,
  Send,
  Settings,
  Timer,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/site/wordmark";
import { Button } from "@/components/ui/button";
import { SelectInput, TextInput } from "@/components/ui/field";
import { EditionProvider, useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { signOut } from "@/actions/auth";
import { ADMIN_YEARS, contactName, initials, labelRole } from "@/lib/admin";
import { adminNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin": LayoutGrid,
  "/admin/events": CalendarDays,
  "/admin/audience": Users,
  "/admin/rsvps": ClipboardCheck,
  "/admin/attendance": ScanLine,
  "/admin/flyer": ImageUp,
  "/admin/volunteers": HeartHandshake,
  "/admin/campaigns": Send,
  "/admin/templates": FileText,
  "/admin/automations": Timer,
  "/admin/content": Newspaper,
  "/admin/analytics": BarChart3,
  "/admin/settings": Settings,
  "/admin/audit": ScrollText,
};

type Hit = { href: string; title: string; subtitle: string; group: string };

function buildHits(
  query: string,
  contacts: { firstName: string; lastName: string; email: string | null; phone: string }[],
  rsvps: { contactId: string; response: string; preferredChannel: string }[],
  auditLogs: { action: string; actorName: string; entityType: string }[],
): Hit[] {
  const q = query.trim().toLowerCase();
  const navHits: Hit[] = adminNav.map((item) => ({
    href: item.href,
    title: item.label,
    subtitle: item.href,
    group: "Pages",
  }));
  const people: Hit[] = contacts.map((contact) => ({
    href: "/admin/audience",
    title: `${contact.firstName} ${contact.lastName}`,
    subtitle: contact.email ?? contact.phone,
    group: "Contacts",
  }));
  const rsvpHits: Hit[] = rsvps.map((row) => ({
    href: "/admin/rsvps",
    title: contactName(row.contactId),
    subtitle: `${row.response} / ${row.preferredChannel}`,
    group: "RSVPs",
  }));
  const auditHits: Hit[] = auditLogs.map((log) => ({
    href: "/admin/audit",
    title: log.action,
    subtitle: `${log.actorName} / ${log.entityType}`,
    group: "Audit",
  }));
  const all = [...navHits, ...people, ...rsvpHits, ...auditHits];
  if (!q) return all.slice(0, 10);
  return all.filter(
    (hit) =>
      hit.title.toLowerCase().includes(q) ||
      hit.subtitle.toLowerCase().includes(q) ||
      hit.group.toLowerCase().includes(q),
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-0.5" aria-label="Admin">
      {adminNav.map((item) => {
        const Icon = ICONS[item.href] ?? LayoutGrid;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm",
              active
                ? "border-red bg-white font-semibold text-ink"
                : "border-transparent text-muted hover:bg-white hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { year, setYear, edition } = useEdition();
  const { profile, contacts, rsvps, auditLogs, volunteers, loading } = useAdminData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const currentAdmin = profile ?? {
    id: "guest",
    name: "Administrator",
    email: "",
    role: "content_editor" as const,
    status: "active" as const,
  };
  const waiting = volunteers.filter(
    (row) => row.status === "submitted" || row.status === "under_review",
  ).length;
  const notifications = [
    waiting
      ? {
          id: "vol-queue",
          title: `${waiting} application${waiting === 1 ? "" : "s"} waiting`,
          body: "Volunteer review queue has new submissions.",
          time: "live",
        }
      : {
          id: "session",
          title: "Operations connected",
          body: loading ? "Loading live records." : "RSVPs, attendance and volunteers read from Supabase.",
          time: "now",
        },
  ];
  const hits = useMemo(
    () => buildHits(search, contacts, rsvps, auditLogs),
    [search, contacts, rsvps, auditLogs],
  );

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-border bg-white lg:flex lg:flex-col">
        <div className="border-b border-border px-4 py-4">
          <Wordmark compact />
          <p className="mt-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
            Operations
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavList pathname={pathname} />
        </div>
        <p className="border-t border-border px-4 py-3 text-xs text-muted">{edition.shortName}</p>
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-30 border-b border-border bg-white">
          <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center border border-border lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="hidden font-display text-sm font-bold sm:block">{edition.shortName}</p>
            <div className="ml-auto flex items-center gap-2">
              <label className="sr-only" htmlFor="edition-switcher">
                Edition
              </label>
              <SelectInput
                id="edition-switcher"
                className="w-24"
                buttonClassName="h-9 rounded-sm px-3 text-sm"
                value={String(year)}
                onValueChange={(value) => setYear(Number(value))}
                options={ADMIN_YEARS.map((item) => ({
                  value: String(item),
                  label: String(item),
                }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden gap-1.5 md:inline-flex"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  aria-expanded={notesOpen}
                  onClick={() => {
                    setNotesOpen((value) => !value);
                    setUserOpen(false);
                  }}
                >
                  <Bell className="h-4 w-4" />
                </Button>
                {notesOpen ? (
                  <div className="absolute right-0 mt-2 w-80 border border-border bg-white p-3 shadow-sm">
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Notifications
                    </p>
                    <ul className="mt-3 grid gap-3">
                      {notifications.map((item) => (
                        <li
                          key={item.id}
                          className="border-t border-border pt-3 first:border-0 first:pt-0"
                        >
                          <p className="text-sm font-semibold text-ink">{item.title}</p>
                          <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                          <p className="mt-1 text-xs text-muted">{item.time}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2"
                  aria-expanded={userOpen}
                  onClick={() => {
                    setUserOpen((value) => !value);
                    setNotesOpen(false);
                  }}
                >
                  <span className="flex h-8 w-8 items-center justify-center bg-ink text-xs font-semibold text-white">
                    {initials(currentAdmin.name)}
                  </span>
                  <span className="hidden text-left text-xs sm:block">
                    <span className="block font-semibold text-ink">{currentAdmin.name}</span>
                    <span className="text-muted">{labelRole(currentAdmin.role)}</span>
                  </span>
                </button>
                {userOpen ? (
                  <div className="absolute right-0 mt-2 w-64 border border-border bg-white p-4 shadow-sm">
                    <p className="font-semibold text-ink">{currentAdmin.name}</p>
                    <p className="text-sm text-muted">{currentAdmin.email}</p>
                    <p className="mt-1 text-xs text-muted">{labelRole(currentAdmin.role)}</p>
                    <form action={signOut}>
                      <Button type="submit" variant="outlineDark" className="mt-4 w-full">
                        Sign out
                      </Button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {searchOpen ? (
          <div
            className="fixed inset-0 z-40 bg-ink/40"
            role="presentation"
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="mx-auto mt-16 w-[min(36rem,calc(100%-1.5rem))] border border-border bg-white"
              role="dialog"
              aria-modal="true"
              aria-label="Global search"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-border p-3">
                <TextInput
                  id="admin-global-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search contacts, RSVPs, pages, audit"
                  autoFocus
                />
              </div>
              <ul className="max-h-80 overflow-y-auto p-2">
                {hits.length === 0 ? (
                  <li className="px-3 py-6 text-sm text-muted">No matches for that query.</li>
                ) : (
                  hits.map((hit) => (
                    <li key={`${hit.group}-${hit.href}-${hit.title}`}>
                      <Link
                        href={hit.href}
                        onClick={() => setSearchOpen(false)}
                        className="block px-3 py-2 hover:bg-paper"
                      >
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                          {hit.group}
                        </p>
                        <p className="text-sm font-semibold text-ink">{hit.title}</p>
                        <p className="text-xs text-muted">{hit.subtitle}</p>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ) : null}

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="flex h-full w-[min(18rem,100%)] flex-col bg-white"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <Wordmark compact />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center border border-border"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3">
                <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        ) : null}

        <main className="px-3 py-6 sm:px-5 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <EditionProvider>
      <AdminChrome>{children}</AdminChrome>
    </EditionProvider>
  );
}
