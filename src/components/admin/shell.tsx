"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
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
  ShieldCheck,
  Timer,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/site/wordmark";
import { Button } from "@/components/ui/button";
import { SelectInput, TextInput } from "@/components/ui/field";
import { EditionProvider, useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { signOut } from "@/actions/auth";
import { updateProfileAvatarAction } from "@/actions/admin";
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
  "/admin/team": ShieldCheck,
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
  const { profile, contacts, rsvps, auditLogs, volunteers, loading, refresh } = useAdminData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrlOverride, setAvatarUrlOverride] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const currentAdmin = profile ?? {
    id: "guest",
    name: "Administrator",
    email: "",
    role: "content_editor" as const,
    status: "active" as const,
  };

  const activeAvatarUrl = avatarUrlOverride ?? currentAdmin.avatarUrl ?? null;

  async function handleAvatarFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarMessage({ text: "Please select an image file (PNG, JPG, WebP).", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ text: "Image file must be under 5MB.", type: "error" });
      return;
    }

    // Set optimistic local preview immediately
    const localPreview = URL.createObjectURL(file);
    setAvatarUrlOverride(localPreview);
    setUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await updateProfileAvatarAction(formData);

      if (res.status === "success" && res.avatarUrl) {
        setAvatarUrlOverride(res.avatarUrl);
        setAvatarMessage({ text: "Profile picture updated successfully!", type: "success" });
        await refresh();
      } else {
        setAvatarUrlOverride(null);
        setAvatarMessage({ text: res.message || "Failed to upload avatar.", type: "error" });
      }
    } catch (err: unknown) {
      setAvatarUrlOverride(null);
      setAvatarMessage({
        text: err instanceof Error ? err.message : "Failed to upload avatar.",
        type: "error",
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

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
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-white p-3 shadow-lg z-50">
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
                  className="flex items-center gap-2 rounded-full p-1 pl-1 pr-2.5 transition-all hover:bg-neutral-100 sm:rounded-xl focus-visible:outline-2 focus-visible:outline-red"
                  aria-expanded={userOpen}
                  aria-label="User profile and photo settings"
                  onClick={() => {
                    setUserOpen((value) => !value);
                    setNotesOpen(false);
                  }}
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-ink text-xs font-semibold text-white shadow-xs">
                    {activeAvatarUrl ? (
                      <img
                        src={activeAvatarUrl}
                        alt={currentAdmin.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials(currentAdmin.name)}</span>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <span className="hidden text-left text-xs sm:block">
                    <span className="block font-semibold text-ink leading-tight">{currentAdmin.name}</span>
                    <span className="text-[11px] text-muted">{labelRole(currentAdmin.role)}</span>
                  </span>
                </button>

                {userOpen ? (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-white p-4 shadow-xl z-50">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileSelect}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      aria-label="Upload profile photo"
                    />

                    {/* Profile Header & Avatar with Camera Button */}
                    <div className="flex flex-col items-center text-center pb-3 border-b border-border">
                      <div
                        className="relative group cursor-pointer mb-2.5"
                        onClick={() => fileInputRef.current?.click()}
                        title="Click to update profile photo"
                      >
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-ink text-lg font-bold text-white shadow-md ring-4 ring-neutral-50 transition-transform group-hover:scale-105">
                          {activeAvatarUrl ? (
                            <img
                              src={activeAvatarUrl}
                              alt={currentAdmin.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{initials(currentAdmin.name)}</span>
                          )}
                        </div>

                        {/* Camera hover overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="h-4 w-4" />
                          <span className="text-[9px] font-semibold mt-0.5 uppercase tracking-wide">Edit</span>
                        </div>

                        {uploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/70">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          </div>
                        )}
                      </div>

                      <p className="font-display text-sm font-bold text-ink">{currentAdmin.name}</p>
                      <p className="text-xs text-muted truncate max-w-full px-1">{currentAdmin.email}</p>
                      
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-ink border border-border">
                          {labelRole(currentAdmin.role)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-neutral-100 transition-colors disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5 text-muted" />
                        {uploadingAvatar ? "Uploading photo..." : "Upload New Photo"}
                      </button>

                      {avatarMessage && (
                        <p
                          className={`mt-2 text-xs font-medium ${
                            avatarMessage.type === "success" ? "text-emerald-600" : "text-red"
                          }`}
                        >
                          {avatarMessage.text}
                        </p>
                      )}
                    </div>

                    {/* Quick navigation & options */}
                    <div className="py-2 space-y-1">
                      <Link
                        href="/admin/team"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink hover:bg-paper transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4 text-muted" />
                        <span>Team & Access Control</span>
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink hover:bg-paper transition-colors"
                      >
                        <Settings className="h-4 w-4 text-muted" />
                        <span>Platform Settings</span>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <form action={signOut}>
                        <Button type="submit" variant="ghost" size="sm" className="w-full text-xs text-muted hover:text-red hover:bg-red/5">
                          Sign out
                        </Button>
                      </form>
                    </div>
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
