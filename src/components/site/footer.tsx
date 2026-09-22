"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Send, CheckCircle2 } from "lucide-react";
import { subscribeNewsletter } from "@/actions/public";
import { SITE } from "@/data/editions";
import { HoverCard } from "@/components/ui/motion";

function YoutubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V6.03a6.29 6.29 0 0 0-.88-.06 6.34 6.34 0 1 0 6.34 6.34V9.25a8.27 8.27 0 0 0 4.77 1.51V7.32a4.85 4.85 0 0 1-1.0-.63z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setMessage(null);
    startTransition(async () => {
      const result = await subscribeNewsletter({ email, source: "footer" });
      if (result.status === "success" || result.status === "existing") {
        setSubscribed(true);
        setEmail("");
        setMessage(result.status === "existing" ? "You are already on the newsletter list." : null);
        return;
      }
      if ("errors" in result) {
        setMessage(result.errors[0]?.message ?? "Enter a valid email address.");
        return;
      }
      setMessage("We could not save that subscription. Please try again.");
    });
  };

  return (
    <footer className="bg-paper text-ink border-t border-border/60">
      <div className="container-site py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr]">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-ink group">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden">
                <Image
                  src="/images/wow-logo-black.webp"
                  alt="Wonders of Worship Logo"
                  fill
                  sizes="80px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span>Wonders of Worship</span>
            </Link>
            
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted font-light">
              An enduring digital platform for congregational worship, scriptural truth, and spiritual encounters across annual editions.
            </p>

            {/* Social Media Icons */}
            <div className="mt-6 flex items-center gap-3">
              <HoverCard scale={1.1} lift={-2}>
                <a
                  href={SITE.social.youtube}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:border-red hover:text-red shadow-2xs"
                >
                  <YoutubeIcon className="h-4 w-4" />
                </a>
              </HoverCard>
              <HoverCard scale={1.1} lift={-2}>
                <a
                  href={SITE.social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:border-red hover:text-red shadow-2xs"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              </HoverCard>
              <HoverCard scale={1.1} lift={-2}>
                <a
                  href={SITE.social.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:border-red hover:text-red shadow-2xs"
                >
                  <TikTokIcon className="h-4 w-4" />
                </a>
              </HoverCard>
              <HoverCard scale={1.1} lift={-2}>
                <a
                  href={`https://wa.me/${SITE.whatsappDisplay.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:border-red hover:text-red shadow-2xs"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              </HoverCard>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h3 className="font-display text-lg font-bold text-ink tracking-wide">Platform</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-red">Home</Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-red">About us</Link>
              </li>
              <li>
                <Link href="/gallery" className="transition-colors hover:text-red">Photo Gallery</Link>
              </li>
              <li>
                <Link href="/flyer" className="transition-colors hover:text-red">Attending Flyer</Link>
              </li>
              <li>
                <Link href="/polo" className="transition-colors hover:text-red">Official Polo</Link>
              </li>
              <li>
                <Link href="/newsletters" className="transition-colors hover:text-red">Newsletter Archive</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Community */}
          <div>
            <h3 className="font-display text-lg font-bold text-ink tracking-wide">Community</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/volunteer" className="transition-colors hover:text-red">Volunteer Intake</Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-red">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="font-display text-lg font-bold text-ink tracking-wide">Newsletter</h3>
            <p className="mt-3 text-sm text-muted font-light leading-relaxed">
              Get edition updates, schedule announcements, and gathering news delivered directly to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="mt-5">
              {subscribed ? (
                <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-700" role="status">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{message ?? "Thank you for subscribing!"}</span>
                </div>
              ) : (
                <div className="flex items-center rounded-full border border-border/80 bg-white p-1 shadow-2xs transition-within focus-within:border-red">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full bg-transparent px-4 py-2 text-sm text-ink outline-none placeholder:text-muted/70"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-deep"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isPending ? "Saving" : "Subscribe"}</span>
                  </button>
                </div>
              )}
              {message && !subscribed ? (
                <p className="mt-2 text-xs font-semibold text-red" role="alert">
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-border/60 bg-white/50">
        <div className="container-site flex flex-col gap-4 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.organizationName}. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 font-medium">
            <Link href="/privacy" className="hover:text-red transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-red transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-red transition-colors">Security</Link>
            <Link href="/privacy" className="hover:text-red transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
