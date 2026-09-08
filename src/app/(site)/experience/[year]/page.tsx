import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/site/countdown";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Button } from "@/components/ui/button";
import { getEditionBySlug, getEditionByYear } from "@/data/editions";
import { getFaqsByEdition } from "@/data/faqs";
import { getFeaturedMinisters, getScheduleByEdition } from "@/data/ministers";
import { formatLongDate, formatTime } from "@/lib/utils";

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
    title: edition.shortName,
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
          title={`${edition.shortName} is not published`}
          lede="Dates, ministers and venue will open after the 2026 gathering. This page exists so the annual rhythm can reuse the same home next year."
        />
        <section className="container-site pb-24">
          <p className="max-w-xl text-muted">
            If you are looking for the current invitation, the 2026 edition is
            the gathering we are preparing now.
          </p>
          <div className="mt-8">
            <Button href="/experience/2026">Open 2026</Button>
          </div>
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
      <section className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
        <Image
          src={heroSrc}
          alt={completed ? "The 2025 gathering" : "Stage prepared for worship"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/60" />
        <div className="relative z-10 flex min-h-[78vh] items-end">
          <div className="container-site py-16 md:max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.16em] uppercase text-white/75">
              {edition.year} edition
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold sm:text-6xl">
              {edition.theme}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">{edition.statement}</p>
            {upcoming ? (
              <div className="mt-8">
                <OpenRsvpButton variant="inverse">I&apos;ll attend</OpenRsvpButton>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-paper py-16 sm:py-20">
        <div className="container-site grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <dl className="grid gap-8 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Date</dt>
              <dd className="mt-1 font-display text-2xl font-semibold">
                {formatLongDate(edition.startsAt, edition.timezone)}
                {edition.isDatePlaceholder ? (
                  <span className="mt-1 block text-sm font-normal text-muted">
                    Placeholder until confirmed
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Time</dt>
              <dd className="mt-1 font-display text-2xl font-semibold">
                {formatTime(edition.startsAt, edition.timezone)} to{" "}
                {formatTime(edition.endsAt, edition.timezone)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted">Venue</dt>
              <dd className="mt-1 font-display text-2xl font-semibold">
                {edition.venue.name}
                <span className="mt-1 block text-base font-normal text-muted">
                  {edition.venue.city}, {edition.venue.country}
                  {edition.isVenuePlaceholder
                    ? ". Final address will be sent with reminders."
                    : `. ${edition.venue.address}`}
                </span>
              </dd>
            </div>
          </dl>
          <div>
            <p className="mb-4 text-sm text-muted">Time remaining</p>
            <Countdown edition={edition} />
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-narrow">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">The invitation</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{edition.description}</p>
        </div>
      </section>

      {schedule.length > 0 ? (
        <section className="bg-white pb-20">
          <div className="container-site">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How the day moves</h2>
            <ol className="mt-12 max-w-3xl">
              {schedule.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-2 border-t border-border py-8 last:border-b md:grid-cols-[10rem_1fr]"
                >
                  <p className="text-sm font-semibold text-red">
                    {formatTime(item.startsAt, edition.timezone)}
                  </p>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-muted">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : completed ? (
        <section className="bg-white pb-20">
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              This edition has closed
            </h2>
            <p className="mt-4 text-muted">
              The {edition.year} gathering is complete. Photographs live in the
              gallery. The next invitation is Wonders of Worship Experience 2026.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/gallery?year=2025" variant="outlineDark">
                Open gallery
              </Button>
              <Button href="/experience/2026">See 2026</Button>
            </div>
          </div>
        </section>
      ) : null}

      {ministers.length > 0 ? (
        <section className="bg-paper py-20 sm:py-24">
          <div className="container-site">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Ministers</h2>
            <p className="mt-4 max-w-xl text-muted">
              A small team for a focused day. Full profiles live on the ministers page.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-12">
              {ministers.map((minister, index) => (
                <article
                  key={minister.id}
                  className={
                    index === 0
                      ? "md:col-span-7"
                      : index === 1
                        ? "md:col-span-5 md:mt-12"
                        : index === 2
                          ? "md:col-span-5"
                          : "md:col-span-7 md:mt-8"
                  }
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-ink">
                    <Image
                      src={minister.imageSrc}
                      alt={minister.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover grayscale"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold">{minister.name}</h3>
                  <p className="text-sm text-red">{minister.role}</p>
                </article>
              ))}
            </div>
            <div className="mt-10">
              <Button href={`/experience/${edition.slug}/ministers`} variant="outlineDark">
                All ministers
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Finding the hall</h2>
            <p className="mt-4 text-muted">{edition.venue.notes}</p>
            <p className="mt-3 text-sm text-muted">
              {edition.venue.address}. {edition.venue.city}, {edition.venue.country}.
            </p>
            <div className="mt-8">
              <Button href={edition.venue.directionsUrl} variant="outlineDark">
                Open directions
              </Button>
            </div>
          </div>
          <div className="flex min-h-64 items-end border border-border bg-paper p-8">
            <p className="max-w-sm text-sm text-muted">
              A mapped pin will be published with the confirmed venue. Until then,
              everyone who RSVPs receives the address with their reminders.
            </p>
          </div>
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="bg-paper py-20">
          <div className="container-site">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Questions people ask</h2>
            <div className="mt-10 max-w-3xl">
              {faqs.map((item) => (
                <details key={item.id} className="border-t border-border py-5 last:border-b">
                  <summary className="cursor-pointer font-display text-xl font-semibold">
                    {item.question}
                  </summary>
                  <p className="mt-3 max-w-2xl text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
            <Link
              href={`/experience/${edition.slug}/faq`}
              className="mt-8 inline-block text-sm font-semibold underline-offset-4 hover:underline"
            >
              All questions
            </Link>
          </div>
        </section>
      ) : null}

      {upcoming ? (
        <section className="bg-red py-20 text-white">
          <div className="container-narrow text-center">
            <h2 className="font-display text-3xl font-bold sm:text-5xl">
              Save your place for {edition.year}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              One decision, a short form, and reminders on WhatsApp, email, or both.
              An RSVP is intent. Attendance is recorded at the venue.
            </p>
            <div className="mt-8">
              <OpenRsvpButton variant="inverse">I&apos;ll attend</OpenRsvpButton>
            </div>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
