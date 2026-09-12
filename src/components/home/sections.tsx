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
                Be in the Room &rarr;
              </OpenRsvpButton>
            </HoverCard>
          </div>
        </FadeIn>
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
                {edition.year} Gathering in <span className="text-red">{edition.venue.city}</span>
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
                  <dd className="mt-1 text-lg font-semibold text-ink leading-snug">
                    {edition.venue.name} <span className="text-muted font-normal">&bull; {edition.venue.address}</span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Right side: Embedded Countdown */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border/80 bg-paper/60 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-red">
                    Countdown to {edition.year}
                  </span>
                  <Link href="/experiences" className="text-xs font-semibold text-red hover:underline">
                    Past editions &rarr;
                  </Link>
                </div>
                <Countdown edition={edition} />
                <p className="mt-4 text-center text-xs text-muted font-medium">
                  Free RSVP required for venue access
                </p>
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

export function ExperiencePreview() {
  return (
    <section className="relative min-h-[75vh] overflow-hidden bg-ink text-white">
      <Image
        src="/images/experience-stage.jpg"
        alt="Worship musicians on stage"
        fill
        sizes="100vw"
        className="object-cover opacity-65"
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
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-site grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <SlideUp>
          <span className="text-xs font-bold uppercase tracking-widest text-red">
            Join the Service Team
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl text-ink">
            Serve the <span className="text-red">Movement</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted font-light leading-relaxed">
            Our volunteer teams anchor hospitality, logistics, prayer, and media across editions. If you are passionate about serving God’s people with excellence, join a team.
          </p>
          <div className="mt-8">
            <HoverCard scale={1.03} className="inline-block">
              <Button href="/volunteer">Apply to volunteer</Button>
            </HoverCard>
          </div>
        </SlideUp>

        <ScaleIn delay={0.2} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-paper shadow-md">
          <Image
            src="/images/volunteer-serve.jpg"
            alt="Volunteers preparing the hall"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </ScaleIn>
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
