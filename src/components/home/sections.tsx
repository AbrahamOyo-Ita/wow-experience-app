"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/site/countdown";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Button } from "@/components/ui/button";
import { getCurrentEdition } from "@/data/editions";
import { getFeaturedMinisters } from "@/data/ministers";
import { getPublishedArticles } from "@/data/articles";
import { formatLongDate, formatTime } from "@/lib/utils";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  AnimatedHighlight,
} from "@/components/ui/motion";

export function SoundRisingSection() {
  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-32 text-white border-y border-white/10">
      {/* Ambient Radial Background Glows */}
      <div className="pointer-events-none absolute -left-32 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-red/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-red-deep/30 blur-[120px]" />

      <div className="container-narrow relative z-10 text-center">
        <SlideUp delay={0.1}>
          <blockquote className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white/95">
            &ldquo;We&rsquo;re not just planning another worship event;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-red-soft">
              something is being prepared
            </span>{" "}
            and when the <AnimatedHighlight className="text-red">Sound Rises</AnimatedHighlight>, you&rsquo;ll want to be in the room.&rdquo;
          </blockquote>
        </SlideUp>

        <FadeIn delay={0.4}>
          <div className="mt-10 flex items-center justify-center gap-4">
            <HoverCard scale={1.04} lift={-2}>
              <OpenRsvpButton variant="inverse">
                I&rsquo;ll be in the room &rarr;
              </OpenRsvpButton>
            </HoverCard>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function FlyerPromoSection() {
  return (
    <section className="bg-paper py-20 border-y border-border/40">
      <div className="container-site grid gap-10 lg:grid-cols-12 lg:items-center">
        <SlideUp className="lg:col-span-6">
          <span className="text-xs font-bold uppercase tracking-widest text-red">
            Attendance Flyer Studio
          </span>
          <h2 className="mt-3 font-display text-4xl sm:text-6xl font-bold leading-tight text-ink">
            Create Your <span className="text-red">Attending Flyer</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted font-light leading-relaxed">
            Let your friends and community know you&rsquo;ll be in the room for Wonders of Worship Experience 2026. Upload your photo, personalize your name, and instantly download your branded flyer to share on WhatsApp & social media.
          </p>
          <div className="mt-8">
            <HoverCard scale={1.03} className="inline-block">
              <Button href="/flyer" size="lg" className="gap-2">
                Create My Flyer &rarr;
              </Button>
            </HoverCard>
          </div>
        </SlideUp>

        <ScaleIn delay={0.2} className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-white p-6 shadow-md">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink">
              <Image
                src="/images/WOW CTA Flyer_122739.png"
                alt="Wonders of Worship Experience Attendance Flyer"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain p-2"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">Flyer Studio 2026</p>
                <p className="text-xs text-muted">Personalized PNG Download</p>
              </div>
              <Button href="/flyer" variant="outlineDark" size="sm">
                Open Studio
              </Button>
            </div>
          </div>
        </ScaleIn>
      </div>
    </section>
  );
}

export function EditionBlock() {
  const edition = getCurrentEdition();
  return (
    <section className="relative overflow-hidden bg-paper py-20 sm:py-28 border-y border-border/40">
      <div className="container-site">
        <SlideUp className="overflow-hidden rounded-3xl border border-border/80 bg-white p-8 sm:p-12 shadow-xs">
          {/* Top Header Row */}
          <div className="flex flex-col gap-4 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-red">
                Upcoming Edition
              </span>
              <h2 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-6xl text-ink">
                WOW Experience <span className="text-red">5.0</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <OpenRsvpButton>Reserve Your Space</OpenRsvpButton>
            </div>
          </div>

          {/* Details & Countdown Layout Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left side: Clean specs list with accent indicators */}
            <div className="lg:col-span-7">
              <dl className="grid gap-6 sm:grid-cols-2">
                <div className="border-l-2 border-red/40 pl-4 py-1">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">Date</dt>
                  <dd className="mt-1 text-xl font-bold text-ink">
                    {formatLongDate(edition.startsAt, edition.timezone)}
                  </dd>
                </div>
                <div className="border-l-2 border-red/40 pl-4 py-1">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">Time</dt>
                  <dd className="mt-1 text-xl font-bold text-ink">
                    {formatTime(edition.startsAt, edition.timezone)} WAT <span className="text-xs font-normal text-muted">(Doors 8:00 AM)</span>
                  </dd>
                </div>
                <div className="sm:col-span-2 border-l-2 border-red/40 pl-4 py-1">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">Venue Location</dt>
                  <dd className="mt-1">
                    <p className="text-lg font-bold text-ink leading-snug">{edition.venue.name}</p>
                    <p className="text-sm font-normal text-muted mt-0.5">{edition.venue.address}</p>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Right side: Bold Red Countdown Box */}
            <div className="lg:col-span-5 h-full flex flex-col">
              <div className="flex-1 rounded-2xl bg-gradient-to-br from-red-deep via-red to-red-deep p-6 sm:p-8 text-white shadow-md flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                    Countdown to {edition.year}
                  </span>
                </div>
                <div className="py-2">
                  <Countdown edition={edition} variant="dark" size="lg" />
                </div>
              </div>
            </div>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}

export function MinistersPreview() {
  const edition = getCurrentEdition();
  const ministers = getFeaturedMinisters(edition.id);
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-site">
        <FadeIn className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-red">
            Lead Worship Ministers
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl text-ink">
            Ministers of the <span className="text-red">Sound</span>
          </h2>
          <p className="mt-4 text-muted text-base">
            Servants led to prepare a room for deep congregational worship and encounters.
          </p>
        </FadeIn>

        <StaggerContainer staggerDelay={0.15} className="mt-12 grid gap-8 md:grid-cols-3">
          {ministers.map((minister) => (
            <StaggerItem key={minister.id}>
              <HoverCard lift={-8} scale={1.015} className="group overflow-hidden rounded-2xl border border-border bg-paper shadow-2xs">
                <div className="relative aspect-[3/4] overflow-hidden bg-ink">
                  <Image
                    src={minister.imageSrc}
                    alt={minister.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-2xl font-bold text-ink">{minister.name}</h3>
                  <p className="text-sm font-semibold text-red">{minister.role}</p>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.3} className="mt-10">
          <Button href="/experience/2026/ministers" variant="outlineDark">
            View full minister profiles
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}

export function MerchPromo() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-site grid gap-8 rounded-3xl border border-border bg-paper p-6 shadow-xs sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl bg-white">
          <Image
            src="/images/WOW_RESOUND POLO BLACK.png"
            alt="WOW T-Shirt merch mockup"
            fill
            sizes="(max-width: 1024px) 80vw, 28vw"
            className="object-contain p-5"
          />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red">
            Official Merch
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-none text-ink sm:text-6xl">
            Get the WOW T-Shirt
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Pick your color and size, then send your order directly on WhatsApp.
          </p>
          <div className="mt-7">
            <Button href="/polo" size="lg">
              View Merch
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExperiencePreview() {
  return (
    <section className="relative min-h-[75vh] overflow-hidden bg-ink text-white">
      <Image
        src="/images/THE WHY BEHIND WOW.jpeg"
        alt="The why behind WOW Experience"
        fill
        sizes="100vw"
        className="object-cover object-[center_28%] opacity-65"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <div className="relative z-10 flex min-h-[75vh] items-end">
        <div className="container-site py-20 md:max-w-2xl">
          <SlideUp>
            <span className="text-xs font-bold uppercase tracking-widest text-red-soft">
              THE WHY BEHIND WOW
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl uppercase">
              We gather to make <AnimatedHighlight className="text-red">Jesus</AnimatedHighlight> visible
            </h2>
            <p className="mt-5 max-w-lg text-white/85 text-lg font-light leading-relaxed">
              WOW exists to bring hearts together in authentic worship, create room for genuine encounters with God, and raise a generation that carries His presence beyond the gathering.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <HoverCard scale={1.03}>
                <Button href="/about" variant="outlineLight">
                  Our core philosophy
                </Button>
              </HoverCard>
              <HoverCard scale={1.03}>
                <Button href="/experiences" variant="ghost" className="text-white hover:bg-white/10">
                  Browse past archives
                </Button>
              </HoverCard>
            </div>
          </SlideUp>
        </div>
      </div>
    </section>
  );
}

export function VolunteerCall() {
  const workforceTeams = [
    { title: "Media", desc: "Audio, lighting, screens & live production" },
    { title: "Prayer & Intercession", desc: "Pre-event prayer & altar ministry" },
    { title: "Publicity & Outreach", desc: "Campus & digital community awareness" },
    { title: "Protocol & Order", desc: "Minister reception & venue decorum" },
    { title: "Ushering & Hospitality", desc: "Warm guest reception & seating" },
    { title: "Registration & Check-In", desc: "QR check-in & desk assistance" },
    { title: "Content Creators", desc: "Social highlights, reels & photography" },
  ];

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-site">
        <div className="max-w-3xl">
          <SlideUp>
            <span className="text-xs font-bold uppercase tracking-widest text-red">
              Join the Service Team
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl text-ink uppercase">
              Join the <span className="text-red">Workforce</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted font-light leading-relaxed">
              We are calling on passionate hearts, willing hands, and dedicated individuals to join the team for WOW EXPERIENCE — a powerful worship gathering created to glorify God, inspire lives, and create an unforgettable encounter with Him. Let&rsquo;s serve together. Let&rsquo;s build together. Let&rsquo;s make an eternal impact.
            </p>
          </SlideUp>
        </div>

        {/* Professional Grid for Workforce Teams */}
        <StaggerContainer staggerDelay={0.08} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workforceTeams.map((team) => (
            <StaggerItem key={team.title}>
              <HoverCard lift={-3} className="h-full rounded-2xl border border-border/80 bg-paper/60 p-6 transition-colors hover:border-red/40 hover:bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red/10 text-xs font-bold text-red">
                    ✓
                  </span>
                  <h3 className="font-display text-xl font-bold text-ink">{team.title}</h3>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed pl-10">
                  {team.desc}
                </p>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.3} className="mt-10">
          <HoverCard scale={1.03} className="inline-block">
            <Button href="/volunteer">Apply to Join Workforce &rarr;</Button>
          </HoverCard>
        </FadeIn>
      </div>
    </section>
  );
}

export function SupportSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("8101654190");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-red-deep via-red to-red-deep py-16 sm:py-20 text-white border-y border-red-deep/40">
      <div className="container-site relative z-10 grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Left-aligned Text */}
        <SlideUp className="lg:col-span-7 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
            <span>Financial Partnership</span>
          </div>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl text-white uppercase">
            Partner With <span className="text-white">WOW Experience</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/90 font-light leading-relaxed max-w-xl">
            Your generous financial contribution enables us to prepare an unhurried atmosphere of worship, host thousands of worshippers, support venue logistics, and extend outreach across Akwa Ibom State and beyond.
          </p>
        </SlideUp>

        {/* Right Column: Direct Transfer Details Card */}
        <SlideUp delay={0.15} className="lg:col-span-5">
          <div className="rounded-3xl bg-white p-6 sm:p-8 text-ink border border-white/20">
            <p className="text-xs font-bold uppercase tracking-widest text-red-deep">Direct Transfer Details</p>
            <dl className="mt-4 grid gap-3.5 text-sm">
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted font-medium">Bank / Provider</dt>
                <dd className="font-bold text-ink text-base">OPay</dd>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted font-medium">Account Number</dt>
                <dd className="flex items-center gap-3">
                  <span className="font-display text-3xl font-bold text-red-deep tracking-wider">8101654190</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-red/30 bg-red-soft px-3 py-1 text-xs font-bold text-red-deep transition hover:bg-red hover:text-white"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </dd>
              </div>
              <div className="flex justify-between pt-0.5">
                <dt className="text-muted font-medium">Account Name</dt>
                <dd className="font-bold text-ink text-base">PATIENCE SOLOMON TIM</dd>
              </div>
            </dl>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}

export function InsightPreview() {
  const article = getPublishedArticles()[0];
  if (!article) return null;
  return (
    <section className="bg-paper py-20 border-t border-border/40">
      <div className="container-site grid gap-10 lg:grid-cols-2 lg:items-center">
        <ScaleIn className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-ink shadow-sm">
          <Image
            src={article.coverImageSrc}
            alt={article.coverImageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </ScaleIn>
        <SlideUp delay={0.15}>
          <p className="text-xs font-bold uppercase tracking-widest text-red">{article.category}</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl text-ink leading-tight">
            {article.title}
          </h2>
          <p className="mt-4 text-muted text-base leading-relaxed">{article.excerpt}</p>
          <Link
            href={`/insights/${article.slug}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red underline-offset-4 hover:underline"
          >
            <span>Read essay insight</span> &rarr;
          </Link>
        </SlideUp>
      </div>
    </section>
  );
}

export function HomeRsvp() {
  return (
    <section id="rsvp" className="bg-paper py-16 sm:py-24 border-t border-border/40">
      <div className="container-site">
        <ScaleIn className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-red-deep via-red to-red-deep p-10 text-center text-white sm:p-16 md:p-20 shadow-xl">
          <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-red-deep/40 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-3xl">
            <FadeIn>
              <h2 className="font-display text-4xl font-bold leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                Where Worship Becomes an <AnimatedHighlight className="text-white/90">Encounter.</AnimatedHighlight>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg font-light">
                Reserve your space for the upcoming edition. Instant confirmation and direct venue updates straight to your inbox and WhatsApp.
              </p>
            </FadeIn>
            <SlideUp delay={0.2} className="mt-8">
              <HoverCard scale={1.05} lift={-3} className="inline-block">
                <OpenRsvpButton variant="inverse">
                  <span>Reserve Your Space &gt;</span>
                </OpenRsvpButton>
              </HoverCard>
            </SlideUp>
          </div>
        </ScaleIn>
      </div>
    </section>
  );
}
