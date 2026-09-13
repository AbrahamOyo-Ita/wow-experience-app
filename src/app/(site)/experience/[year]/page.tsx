import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/site/countdown";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Button } from "@/components/ui/button";
import { getEditionBySlug, getEditionByYear } from "@/data/editions";
import { getFaqsByEdition } from "@/data/faqs";
import { getFeaturedMinisters, getScheduleByEdition } from "@/data/ministers";
import { formatLongDate, formatTime } from "@/lib/utils";
import { FadeIn, SlideUp, ScaleIn, StaggerContainer, StaggerItem, HoverCard } from "@/components/ui/motion";

const YEARS = ["2025", "2026", "2027"] as const;

export function generateStaticParams() {
  return YEARS.map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const edition = getEditionBySlug(year) ?? getEditionByYear(Number(year));
  if (!edition) return { title: "Experience" };
  return {
    title: `${edition.shortName} | Wonders of Worship Experience`,
    description: edition.description,
  };
}

export default async function ExperienceYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const edition = getEditionBySlug(year) ?? getEditionByYear(Number(year));
  if (!edition) notFound();

  if (edition.status === "draft") {
    return (
      <PageShell>
        <PageIntro
          title={`${edition.shortName} Gathering`}
          lede="Dates, minister announcements, and registration will open after the 2026 edition concludes. Our digital platform preserves room for every annual chapter."
        />
        <section className="container-site pb-24">
          <SlideUp className="max-w-xl">
            <p className="text-muted text-base leading-relaxed">
              If you are seeking to attend our current gathering, registration for the 2026 edition is currently open.
            </p>
            <div className="mt-8">
              <HoverCard scale={1.03} className="inline-block">
                <Button href="/experience/2026">Explore 2026 Gathering</Button>
              </HoverCard>
            </div>
          </SlideUp>
        </section>
      </PageShell>
    );
  }

  const ministers = getFeaturedMinisters(edition.id);
  const faqs = getFaqsByEdition(edition.id).slice(0, 3);
  const schedule = getScheduleByEdition(edition.id);
  const upcoming = edition.status === "published" || edition.status === "live";
  const completed = edition.status === "completed" || edition.status === "archived";
  const heroSrc = completed ? "/images/gallery-gathering.jpg" : "/images/experience-stage.jpg";

  return (
    <PageShell>
      {/* Hero Header */}
      <section className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
        <Image
          src={heroSrc}
          alt={completed ? "The 2025 gathering" : "Stage prepared for worship"}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative z-10 flex min-h-[78vh] items-end">
          <div className="container-site py-16 md:max-w-3xl">
            <FadeIn>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-red-soft backdrop-blur-md">
                <span>{edition.year} Gathering Edition</span>
              </span>
            </FadeIn>
            
            <SlideUp delay={0.15}>
              <h1 className="mt-4 font-display text-4xl font-bold sm:text-6xl text-white">
                {edition.theme}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/85 font-light leading-relaxed">
                {edition.statement}
              </p>
            </SlideUp>

            {upcoming ? (
              <FadeIn delay={0.3} className="mt-8 flex flex-wrap gap-3">
                <HoverCard scale={1.03}>
                  <OpenRsvpButton variant="inverse">Reserve your space</OpenRsvpButton>
                </HoverCard>
                <HoverCard scale={1.03}>
                  <Button href="/flyer" variant="outlineLight">
                    Create attending flyer
                  </Button>
                </HoverCard>
              </FadeIn>
            ) : null}
          </div>
        </div>
      </section>

      {/* Gathering Logistics Bar */}
      <section className="bg-paper py-16 sm:py-20 border-b border-border/40">
        <div className="container-site grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <SlideUp>
            <dl className="grid gap-8 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-white p-5 shadow-2xs">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Date</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-ink">
                  {formatLongDate(edition.startsAt, edition.timezone)}
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-white p-5 shadow-2xs">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Gathering Time</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-ink">
                  {formatTime(edition.startsAt, edition.timezone)} to {formatTime(edition.endsAt, edition.timezone)} WAT
                </dd>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-border bg-white p-5 shadow-2xs">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Venue Location</dt>
                <dd className="mt-1 font-display text-xl font-bold text-ink">
                  {edition.venue.name}
                  <span className="mt-1 block text-sm font-normal text-muted">
                    {edition.venue.address}. {edition.venue.city}, {edition.venue.country}
                  </span>
                </dd>
              </div>
            </dl>
          </SlideUp>

          <ScaleIn delay={0.2} className="rounded-2xl border border-border bg-white p-8 shadow-2xs">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-red">
              {completed ? "Completed Gathering" : "Time Remaining"}
            </p>
            <Countdown edition={edition} />
          </ScaleIn>
        </div>
      </section>

      {/* Description Section */}
      <section className="bg-white py-20">
        <div className="container-narrow">
          <SlideUp>
            <span className="text-xs font-bold uppercase tracking-widest text-red">The Invitation</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink">
              About this Gathering
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted font-light">
              {edition.description}
            </p>
          </SlideUp>
        </div>
      </section>

      {/* Schedule */}
      {schedule.length > 0 ? (
        <section className="bg-white pb-20 border-t border-border/40 pt-16">
          <div className="container-site">
            <FadeIn>
              <span className="text-xs font-bold uppercase tracking-widest text-red">Gathering Flow</span>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink">Schedule & Order</h2>
            </FadeIn>

            <StaggerContainer staggerDelay={0.12} className="mt-10 max-w-3xl space-y-4">
              {schedule.map((item) => (
                <StaggerItem key={item.id}>
                  <HoverCard lift={-2} className="grid gap-3 rounded-xl border border-border bg-paper p-6 sm:grid-cols-[10rem_1fr] items-center">
                    <p className="text-sm font-bold text-red">
                      {formatTime(item.startsAt, edition.timezone)} WAT
                    </p>
                    <div>
                      <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted leading-relaxed">{item.description}</p>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      ) : completed ? (
        <section className="bg-white pb-20">
          <div className="container-narrow">
            <SlideUp>
              <h2 className="font-display text-3xl font-bold sm:text-4xl text-ink">
                Archive Chapter
              </h2>
              <p className="mt-4 text-muted text-base">
                The {edition.year} edition is completed. Photographs and memories are preserved in our gallery archives.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <HoverCard scale={1.03}>
                  <Button href="/gallery?year=2025" variant="outlineDark">
                    Browse 2025 photo gallery
                  </Button>
                </HoverCard>
                <HoverCard scale={1.03}>
                  <Button href="/experience/2026">Explore 2026 Gathering</Button>
                </HoverCard>
              </div>
            </SlideUp>
          </div>
        </section>
      ) : null}

      {/* Ministers */}
      {ministers.length > 0 ? (
        <section className="bg-paper py-20 sm:py-24 border-y border-border/40">
          <div className="container-site">
            <FadeIn>
              <span className="text-xs font-bold uppercase tracking-widest text-red">Worship Ministers</span>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink">Ministers</h2>
            </FadeIn>

            <StaggerContainer staggerDelay={0.12} className="mt-12 grid gap-8 md:grid-cols-3">
              {ministers.map((minister) => (
                <StaggerItem key={minister.id}>
                  <HoverCard lift={-6} className="group overflow-hidden rounded-2xl border border-border bg-white shadow-2xs">
                    <div className="relative aspect-[3/4] overflow-hidden bg-ink">
                      <Image
                        src={minister.imageSrc}
                        alt={minister.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-2xl font-bold text-ink">{minister.name}</h3>
                      <p className="text-sm font-semibold text-red">{minister.role}</p>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      ) : null}

      {/* Venue Section */}
      <section className="bg-white py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SlideUp>
            <span className="text-xs font-bold uppercase tracking-widest text-red">Venue & Access</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink">Venue Details</h2>
            <p className="mt-4 text-muted text-base">{edition.venue.notes}</p>
            <p className="mt-3 text-sm font-semibold text-ink">
              {edition.venue.name} &bull; {edition.venue.address}, {edition.venue.city}
            </p>
            <div className="mt-8">
              <HoverCard scale={1.03} className="inline-block">
                <Button href={edition.venue.directionsUrl} variant="outlineDark">
                  Open directions on Google Maps
                </Button>
              </HoverCard>
            </div>
          </SlideUp>

          <ScaleIn delay={0.2} className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-paper p-8 text-center">
            <p className="max-w-sm text-sm text-muted leading-relaxed">
              Confirmed attendees will receive direct direction pins, parking guidance, and arrival updates via email and WhatsApp.
            </p>
          </ScaleIn>
        </div>
      </section>

      {/* FAQs */}
      {faqs.length > 0 ? (
        <section className="bg-paper py-20 border-t border-border/40">
          <div className="container-site">
            <FadeIn>
              <span className="text-xs font-bold uppercase tracking-widest text-red">Frequently Asked Questions</span>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink">Information for Attendees</h2>
            </FadeIn>

            <StaggerContainer staggerDelay={0.1} className="mt-10 max-w-3xl space-y-4">
              {faqs.map((item) => (
                <StaggerItem key={item.id}>
                  <details className="group rounded-xl border border-border bg-white p-5 shadow-2xs">
                    <summary className="cursor-pointer font-display text-xl font-bold text-ink hover:text-red transition-colors list-none flex items-center justify-between">
                      <span>{item.question}</span>
                      <span className="text-red transition-transform group-open:rotate-180">+</span>
                    </summary>
                    <p className="mt-4 text-muted text-base leading-relaxed border-t border-border/40 pt-3">{item.answer}</p>
                  </details>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      ) : null}

      {/* RSVP Footer Banner */}
      {upcoming ? (
        <section className="bg-red py-20 text-white">
          <div className="container-narrow text-center">
            <FadeIn>
              <h2 className="font-display text-4xl font-bold sm:text-6xl">
                Reserve your space for {edition.year}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/90 text-lg font-light leading-relaxed">
                Experience pure congregational worship. Instant RSVP confirmation and reminders sent directly to your phone.
              </p>
            </FadeIn>
            <SlideUp delay={0.2} className="mt-8">
              <div className="flex flex-wrap justify-center gap-3">
                <HoverCard scale={1.04}>
                  <OpenRsvpButton variant="inverse">Reserve your space</OpenRsvpButton>
                </HoverCard>
                <HoverCard scale={1.04}>
                  <Button href="/flyer" variant="outlineLight">
                    Create attending flyer
                  </Button>
                </HoverCard>
              </div>
            </SlideUp>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
