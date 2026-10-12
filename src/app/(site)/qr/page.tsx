import type { Metadata } from "next";
import { Globe2, QrCode } from "lucide-react";
import { PrayerQrDownload } from "@/components/prayer/prayer-qr-download";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Public Site QR Code",
  description: "Download a branded QR code that opens the Wonders of Worship public website.",
  alternates: { canonical: "/qr" },
};

export default function PublicQrPage() {
  return (
    <PageShell>
      <main className="mx-auto grid min-h-[calc(100dvh-72px)] w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
        <section>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red"><Globe2 className="h-4 w-4" />Public website</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-[1.03] text-ink sm:text-7xl">One scan. The whole WOW experience.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted">Download this branded QR code for your flyers, backdrop, welcome desk, and social posts. It opens the public Wonders of Worship website.</p>
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-ink"><QrCode className="h-5 w-5 text-red" />High-resolution, backdrop-ready downloads</div>
        </section>
        <section className="rounded-[2rem] bg-ink p-7 text-white shadow-[0_25px_70px_rgba(17,17,17,0.18)] sm:p-10">
          <h2 className="font-display text-2xl font-bold">Download the public-site QR</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">The code opens www.wowexperience.com.ng</p>
          <PrayerQrDownload targetPath="/" label="Scan to open site" downloadPrefix="wow-public-site-qr" />
        </section>
      </main>
    </PageShell>
  );
}
