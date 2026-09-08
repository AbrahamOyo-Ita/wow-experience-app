"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/site/wordmark";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { publicNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SiteHeader({ inverted = false }: { inverted?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onDark = inverted;

  return (
    <header
      className={cn(
        "z-40",
        onDark
          ? "absolute inset-x-0 top-0 text-white"
          : "sticky top-0 border-b border-border/80 bg-white/95 text-ink backdrop-blur-md",
      )}
    >
      <div className="container-site flex h-[72px] items-center justify-between gap-6">
        <Wordmark inverted={onDark} />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {publicNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  onDark ? "text-white/80 hover:text-white" : "text-ink/70 hover:text-ink",
                  active && (onDark ? "text-white" : "text-ink"),
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <OpenRsvpButton
              variant={onDark ? "inverse" : "primary"}
              className="px-5 py-2.5"
            >
              I&apos;ll attend
            </OpenRsvpButton>
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border lg:hidden",
              onDark ? "border-white/30 text-white" : "border-border text-ink",
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-50 bg-ink text-white lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="container-site flex h-[72px] items-center justify-between">
            <Wordmark inverted />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav className="container-site mt-8 grid gap-2">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-4 text-2xl font-display font-semibold"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-8">
              <OpenRsvpButton variant="inverse">I&apos;ll attend</OpenRsvpButton>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
