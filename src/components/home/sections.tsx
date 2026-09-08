import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/site/countdown";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Button } from "@/components/ui/button";
import { getCurrentEdition } from "@/data/editions";
import { getFeaturedMinisters } from "@/data/ministers";
import { getPublishedArticles } from "@/data/articles";
import { formatLongDate, formatTime } from "@/lib/utils";

export function EditionBlock() {
  const edition = getCurrentEdition();
  return (
    <section className="bg-paper py-20 sm:py-24">
      <div className="container-site grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div>
          <h2 className="font-display text-5xl leading-none sm:text-6xl">
            {edition.year} in <span className="text-red">{edition.venue.city}</span>
          </h2>
          <dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Date</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatLongDate(edition.startsAt, edition.timezone)}
                {edition.isDatePlaceholder ? (
                  <span className="block text-sm font-normal text-muted">Placeholder until confirmed</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Time</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatTime(edition.startsAt, edition.timezone)} WAT
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Venue</dt>
              <dd className="mt-1 text-lg font-semibold">
                {edition.venue.name}
                {edition.isVenuePlaceholder ? (
                  <span className="block text-sm font-normal text-muted">
                    Confirmed address will be sent with reminders
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="mb-4 text-sm text-muted">Time remaining</p>
          <Countdown edition={edition} />
        </div>
      </div>
    </section>
  );
}

export function MinistersPreview() {
  const edition = getCurrentEdition();
  const ministers = getFeaturedMinisters(edition.id);
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-site">
        <div className="max-w-xl">
          <h2 className="font-display text-5xl leading-none sm:text-6xl">
            Meet the <span className="text-red">ministers</span>
          </h2>
          <p className="mt-4 text-muted">
            A small team for a focused day. Full profiles live on the ministers page.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {ministers.map((minister, index) => (
            <article key={minister.id} className={index === 1 ? "md:mt-10" : ""}>
              <div className="relative aspect-[3/4] overflow-hidden bg-ink">
                <Image
                  src={minister.imageSrc}
                  alt={minister.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover grayscale"
                />
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">{minister.name}</h3>
              <p className="text-sm text-red">{minister.role}</p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Button href="/experience/2026/ministers" variant="outlineDark">
            All ministers
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ExperiencePreview() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-ink text-white">
      <Image
        src="/images/experience-stage.jpg"
        alt="Worship musicians on stage"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative z-10 flex min-h-[70vh] items-end">
        <div className="container-site py-16 md:max-w-2xl">
          <h2 className="font-display text-5xl leading-none sm:text-7xl">
            We gather to make <span className="text-red">Christ</span> visible
          </h2>
          <p className="mt-5 max-w-lg text-white/80">
            The day is simple by design: doors, worship, the word, response.
            Come ready to participate, not to watch a production.
          </p>
          <div className="mt-8">
            <Button href="/experience/2026" variant="outlineLight">
              The 2026 experience
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VolunteerCall() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-site grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 className="font-display text-5xl leading-none sm:text-6xl">
            Serve the <span className="text-red">gathering</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Volunteer teams keep the room calm and the work invisible. Apply if
            you can keep a clear commitment. If this season is full, come as a guest.
          </p>
          <div className="mt-8">
            <Button href="/volunteer">Volunteer</Button>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-paper">
          <Image
            src="/images/volunteer-serve.jpg"
            alt="Volunteers preparing the hall"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export function InsightPreview() {
  const article = getPublishedArticles()[0];
  if (!article) return null;
  return (
    <section className="bg-paper py-20">
      <div className="container-site grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[16/10] overflow-hidden bg-ink">
          <Image
            src={article.coverImageSrc}
            alt={article.coverImageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-red">{article.category}</p>
          <h2 className="mt-3 font-display text-5xl leading-none">
            {article.title}
          </h2>
          <p className="mt-4 text-muted">{article.excerpt}</p>
          <Link
            href={`/insights/${article.slug}`}
            className="mt-6 inline-block text-sm font-semibold underline-offset-4 hover:underline"
          >
            Read insight
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeRsvp() {
  return (
    <section id="rsvp" className="bg-red py-20 text-white">
      <div className="container-narrow text-center">
        <h2 className="font-display text-5xl leading-none sm:text-6xl">
          I&apos;ll be <span className="text-white/75">there</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/85">
          One decision, a short form, and reminders on WhatsApp, email, or both.
          You can leave the list at any time.
        </p>
        <div className="mt-8">
          <OpenRsvpButton variant="inverse">I&apos;ll attend</OpenRsvpButton>
        </div>
      </div>
    </section>
  );
}
