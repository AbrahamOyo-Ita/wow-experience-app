import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { PrayerForm } from "@/components/prayer/prayer-form";
import { PrayerQrDownload } from "@/components/prayer/prayer-qr-download";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Share a Prayer Request",
  description:
    "Share a private prayer request with the Wonders of Worship prayer team.",
  alternates: { canonical: "/prayer" },
};

export default function PrayerPage() {
  return (
    <PageShell>
      <section className="grid min-h-[calc(100dvh-72px)] bg-white lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative order-2 min-h-[580px] overflow-hidden bg-ink lg:order-1 lg:min-h-full">
          <Image
            src="/images/hero-worship.jpg"
            alt="A quiet moment of worship and prayer at Wonders of Worship"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.12),rgba(17,17,17,0.88))]" />

          <div className="relative flex h-full min-h-[580px] flex-col justify-between p-6 text-white sm:p-10 lg:min-h-[calc(100dvh-72px)] lg:p-12 xl:p-16">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <HeartHandshake className="h-5 w-5 text-red-soft" strokeWidth={1.7} aria-hidden="true" />
              <span>Wonders of Worship Prayer Team</span>
            </div>

            <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end lg:grid-cols-1 xl:grid-cols-[1fr_auto]">
              <div>
                <h2 className="max-w-md font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
                  You do not have to carry it alone.
                </h2>
                <p className="mt-4 max-w-md text-base leading-7 text-white/78">
                  Scan this code to open the prayer form. Every request is received with care and handled privately.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm text-white/82">
                  <ShieldCheck className="h-4 w-4 text-red-soft" strokeWidth={1.8} aria-hidden="true" />
                  No account required
                </div>
              </div>

              <div className="shrink-0">
                <PrayerQrDownload />
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 flex items-center lg:order-2">
          <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-10 sm:py-16 lg:px-12 xl:px-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red">Prayer request</p>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-bold leading-[1.04] text-ink sm:text-6xl">
              Tell us how we can pray with you.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted">
              Share as much or as little as you feel comfortable sharing.
            </p>

            <div className="mt-9">
              <PrayerForm />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
