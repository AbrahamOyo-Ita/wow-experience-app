"use client";

import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/site/countdown";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Button } from "@/components/ui/button";
import { getCurrentEdition } from "@/data/editions";
import { getFeaturedMinisters } from "@/data/ministers";
import { getPublishedArticles } from "@/data/articles";
import { formatLongDate, formatTime } from "@/lib/utils";
import type { Minister } from "@/types";
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
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-ink p-6 text-white shadow-xl">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-ink via-ink/90 to-ink p-6 flex flex-col justify-between text-center">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-red-soft">
                  Wonders of Worship Experience 2026
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-white uppercase">
                  I Will Be <span className="text-red">Attending</span>
                </h3>
              </div>

              {/* Dummy Photo Avatar Frame Preview */}
              <div className="my-auto mx-auto flex flex-col items-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-red bg-white/10 p-1 shadow-lg flex items-center justify-center">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white/15 text-white/60">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-white tracking-wide">YOUR NAME HERE</p>
                <p className="text-[0.7rem] font-medium text-white/70">Attending from Your City</p>
              </div>

              <div className="border-t border-white/15 pt-3">
                <p className="text-[0.68rem] font-semibold text-white/80 uppercase tracking-widest">
                  October 18, 2026 • Doors Open 8:00 AM
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Attendance Flyer Studio</p>
                <p className="text-xs text-white/60">Generate your personalized PNG flyer</p>
              </div>
              <Button href="/flyer" variant="inverse" size="sm">
                Create Yours &rarr;
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

export function MinistersPreview({ ministers }: { ministers?: Minister[] } = {}) {
  const edition = getCurrentEdition();
  const list = ministers ?? getFeaturedMinisters(edition.id);
  if (list.length === 0) return null;

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
          {list.map((minister) => (
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
          <Button href="/about" variant="outlineDark">
            Learn about our ministry
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
                <Button href="/gallery" variant="ghost" className="text-white hover:bg-white/10">
                  Browse photo gallery
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
              Service Teams
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl text-ink uppercase">
              BE PART OF THE <span className="text-red">EXPERIENCE</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted font-light leading-relaxed">
              WOW Experience comes to life through hearts willing to serve. Bring your gifts, your passion, and your hands. Find your place on the team and help us prepare for RESOUND 2026.
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
  const whatsappPhone = "2348101654190";
  const defaultMessage = "Hi, I want to support WOW Experience.";
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-red-deep via-red to-red-deep py-16 sm:py-20 text-white border-y border-red-deep/40">
      <div className="container-site relative z-10 grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Left-aligned Text */}
        <SlideUp className="lg:col-span-7 text-left">
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-6xl text-white uppercase">
            SOW INTO THE <span className="text-white">VISION</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/90 font-light leading-relaxed max-w-xl">
            Behind every moment at WOW are people who gave, served, prayed, and believed in the vision. You can be part of that story by supporting RESOUND 2026.
          </p>
        </SlideUp>

        {/* Right Column: WhatsApp Direct Partnership Card */}
        <SlideUp delay={0.15} className="lg:col-span-5">
          <div className="rounded-3xl bg-white p-6 sm:p-8 text-ink border border-white/20 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-deep mb-2">
              Direct Partnership
            </p>
            <h3 className="font-display text-2xl font-bold text-ink uppercase">
              Support via WhatsApp
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed font-light">
              To make a financial contribution or inquire about giving to WOW Experience, connect directly with our partnership team on WhatsApp.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#20bd5a] hover:shadow-lg active:scale-[0.98]"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.763.459 3.486 1.332 5.001L2 22l5.127-1.341c1.464.798 3.119 1.218 4.881 1.219h.004c5.504 0 9.987-4.478 9.988-9.984 0-2.666-1.037-5.172-2.923-7.058C17.19 2.95 14.68 1.999 12.012 2zM12.012 20.37h-.003c-1.498 0-2.968-.396-4.256-1.144l-.305-.18-3.045.797.812-2.968-.198-.315a8.293 8.293 0 0 1-1.272-4.576c0-4.587 3.733-8.318 8.32-8.318 2.222 0 4.31.866 5.88 2.438a8.27 8.27 0 0 1 2.434 5.882c0 4.588-3.732 8.32-8.317 8.32zm4.56-6.225c-.25-.125-1.481-.731-1.71-.814-.23-.083-.396-.125-.563.125-.166.25-.646.814-.792.981-.146.166-.292.187-.542.062a6.865 6.865 0 0 1-2.014-1.242 7.56 7.56 0 0 1-1.393-1.734c-.146-.25-.015-.385.11-.51.112-.112.25-.292.375-.438.125-.146.166-.25.25-.416.083-.166.042-.312-.02-.437-.063-.125-.563-1.354-.772-1.854-.203-.487-.41-.421-.563-.429h-.479c-.167 0-.438.063-.667.313s-.875.854-.875 2.083c0 1.229.896 2.417 1.02 2.584.125.166 1.764 2.694 4.274 3.778.597.257 1.063.41 1.426.526.598.19 1.142.163 1.572.099.48-.071 1.481-.605 1.688-1.189.208-.584.208-1.084.146-1.189-.063-.104-.229-.166-.479-.291z"/>
              </svg>
              <span>Send a message on WhatsApp</span>
            </a>
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
