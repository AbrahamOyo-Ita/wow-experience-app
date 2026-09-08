import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { getCurrentEdition } from "@/data/editions";
import { formatLongDate } from "@/lib/utils";

export function HomeHero() {
  const edition = getCurrentEdition();
  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-ink text-white">
      <Image
        src="/images/hero-worship.jpg"
        alt="Congregation gathered in worship"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-ink/55" />
      <SiteHeader inverted />
      <div className="relative z-10 flex min-h-[100dvh] items-center px-4 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-white/80">
            {edition.year} edition
          </p>
          <h1 className="mt-5 font-display text-[2.75rem] leading-none sm:text-7xl lg:text-8xl">
            A people gathered in{" "}
            <em className="text-red not-italic sm:italic">wonder</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            {formatLongDate(edition.startsAt, edition.timezone)}
            {edition.isDatePlaceholder ? " (placeholder)" : ""}. {edition.venue.name}.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <OpenRsvpButton variant="inverse">I&apos;ll attend</OpenRsvpButton>
            <Link
              href="/experience/2026"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Explore the experience
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PurposeBand() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-narrow text-center">
        <h2 className="font-display text-4xl leading-none sm:text-6xl">
          Worship. The <span className="text-red">word</span>. A clear response.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Wonders of Worship Experience is a focused gathering, not a festival.
          We publicize the day, prepare a room, and take care with the people
          who say they are coming.
        </p>
      </div>
    </section>
  );
}
