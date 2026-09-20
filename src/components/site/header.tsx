"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/site/wordmark";
import { publicNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SiteHeader({ inverted = false }: { inverted?: boolean }) {
  const pathname = usePathname();
  return <SiteHeaderContent key={pathname} pathname={pathname} inverted={inverted} />;
}

function SiteHeaderContent({
  pathname,
  inverted,
}: {
  pathname: string;
  inverted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const onDark = inverted;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
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
            <Link
              href="/experiences"
              className={cn(
                "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition duration-200 ease-out active:scale-[0.98]",
                onDark ? "bg-white text-ink hover:bg-white/90" : "bg-red text-white hover:bg-red-deep",
              )}
            >
              Explore all editions
            </Link>
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border lg:hidden transition-transform active:scale-95",
              onDark ? "border-white/30 text-white" : "border-border text-ink",
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((current) => !current)}
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col bg-ink text-white lg:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="container-site flex h-[72px] shrink-0 items-center justify-between">
              <Wordmark inverted />
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Close menu</span>
              </motion.button>
            </div>
            <nav className="container-site my-auto py-8 grid gap-1">
              {publicNav.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/10 py-3.5 text-2xl font-display font-semibold transition-colors hover:text-red-soft"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="pt-6"
              >
                <Link
                  href="/experiences"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-white px-6 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:bg-white/90"
                >
                  Explore all editions
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
