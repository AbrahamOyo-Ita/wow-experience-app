import type { Metadata } from "next";
import Image from "next/image";
import { Sparkles, Heart, Quote, Users, BookOpen, Clock, MapPin } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { organizingTeam, previousImpact, values } from "@/data/content";
import { getEditionByYear } from "@/data/editions";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Wonders of Worship Experience exists, how the gathering is organised, and what we learned from the first edition.",
};

export default function AboutPage() {
  const nextEdition = getEditionByYear(2026);

  return (
    <PageShell>
      {/* Redesigned Hero Intro Banner */}
      <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
        {/* Glow and texture accents */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-red/25 blur-[120px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container-site relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-soft backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-red" />
            <span>About the gathering</span>
          </div>

          <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
            A gathering, not a{" "}
            <span className="font-serif italic font-normal text-red">programme</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl font-light">
            Wonders of Worship Experience is an annual day given to congregational singing,
            Scripture and a quiet invitation to respond. We exist so a room of people can look at
            Christ without rushing to the next cue.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-white/25">
              <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Format</p>
              <p className="mt-1 text-base font-semibold text-white">1 Full Day</p>
              <p className="text-xs text-white/70">Congregational Worship</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-white/25">
              <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Clocks</p>
              <p className="mt-1 text-base font-semibold text-white">Zero Timers</p>
              <p className="text-xs text-white/70">Unhurried Presence</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-white/25">
              <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Anchor</p>
              <p className="mt-1 text-base font-semibold text-white">Scripture</p>
              <p className="text-xs text-white/70">Focused Word</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-white/25">
              <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Location</p>
              <p className="mt-1 text-base font-semibold text-white">Uyo, NG</p>
              <p className="text-xs text-white/70">Annual Gathering</p>
            </div>
          </div>
        </div>
      </section>

      {/* Redesigned "Why We Gather" Section */}
      <section className="relative bg-gradient-to-b from-paper via-white to-white py-20 sm:py-28">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Narrative & Key Pillars */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red">
                <Heart className="h-3.5 w-3.5 fill-red/20 text-red" />
                <span>Our Heart & Purpose</span>
              </div>

              <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl text-ink">
                Why We Gather
              </h2>

              {/* Styled Highlight Quote Card */}
              <div className="relative my-8 rounded-2xl border border-red/20 bg-white p-6 shadow-sm border-l-4 border-l-red sm:p-7">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-red/10" />
                <p className="relative z-10 text-lg leading-relaxed font-medium text-ink/90 italic">
                  &ldquo;Worship can become a schedule. Songs start, lights move, and nobody has
                  actually stayed with Jesus. This gathering is built the other way around: a
                  prepared people, a short word, and enough time to sing until the room is honest.&rdquo;
                </p>
              </div>

              <p className="max-w-2xl leading-relaxed text-muted text-base">
                The website is only an invitation. Dates, directions and reminders belong here. The
                point remains a Sunday morning in Uyo when the site can disappear and the
                congregation takes over.
              </p>

              {/* Feature Cards Grid */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-white p-4 shadow-2xs transition hover:border-red/40 hover:shadow-xs">
                  <Users className="h-5 w-5 text-red" />
                  <h3 className="mt-3 font-semibold text-ink text-sm">Congregation First</h3>
                  <p className="mt-1 text-xs text-muted leading-snug">
                    Active worshippers, not passive spectators.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4 shadow-2xs transition hover:border-red/40 hover:shadow-xs">
                  <BookOpen className="h-5 w-5 text-red" />
                  <h3 className="mt-3 font-semibold text-ink text-sm">Scripture Centered</h3>
                  <p className="mt-1 text-xs text-muted leading-snug">
                    Short, intentional word to center our focus.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4 shadow-2xs transition hover:border-red/40 hover:shadow-xs">
                  <Clock className="h-5 w-5 text-red" />
                  <h3 className="mt-3 font-semibold text-ink text-sm">Unhurried Space</h3>
                  <p className="mt-1 text-xs text-muted leading-snug">
                    Freedom to remain without production pressure.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Layered Frame & Overlay Pill */}
            <div className="lg:col-span-5">
              <div className="group relative">
                {/* Accent glow frame behind image */}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-red/30 via-red/10 to-transparent blur-xl opacity-70 transition duration-500 group-hover:opacity-100" />

                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink border border-ink/10 shadow-2xl lg:aspect-[5/6]">
                  <Image
                    src="/images/about-worship-hero.jpg"
                    alt="Congregation gathered in authentic worship"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Gradient bottom shadow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />

                  {/* Glassmorphism Floating Overlay Pill */}
                  <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/20 bg-ink/75 p-4 backdrop-blur-md text-white shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red text-white shadow-sm">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">Pure Congregational Worship</p>
                        <p className="text-xs text-white/75 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3 text-red-soft" />
                          <span>Uyo, Nigeria &bull; Annual Experience</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper py-20 sm:py-24">
        <div className="container-site">
          <h2 className="max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            What we refuse to trade away
          </h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-2">
            {values.map((value, index) => (
              <li
                key={value.title}
                className={index === 0 ? "md:col-span-2 md:max-w-2xl" : ""}
              >
                <h3 className="font-display text-2xl font-semibold">{value.title}</h3>
                <p className="mt-3 max-w-prose text-muted">{value.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="container-site">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            The people who hold the day
          </h2>
          <p className="mt-4 max-w-xl text-muted">
            Ministers serve the platform. This smaller team carries purpose,
            timing and the way we speak to guests.
          </p>
          <div className="mt-12 grid gap-10 md:grid-cols-12">
            {organizingTeam.map((person, index) => (
              <article
                key={person.name}
                className={
                  index === 0
                    ? "md:col-span-6"
                    : index === 1
                      ? "md:col-span-6 md:mt-16"
                      : "md:col-span-7 md:col-start-6"
                }
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                  <Image
                    src={person.imageSrc}
                    alt={person.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover grayscale"
                  />
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold">{person.name}</h3>
                <p className="text-sm text-red">{person.role}</p>
                <p className="mt-3 max-w-md text-muted">{person.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
        <Image
          src="/images/gallery-gathering.jpg"
          alt="The 2025 congregation"
          fill
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="relative z-10 container-site">
          <p className="text-sm font-semibold text-white/70">{previousImpact.year}</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-5xl">
            {previousImpact.theme}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-white/80">{previousImpact.summary}</p>
          <ul className="mt-8 max-w-lg space-y-3 text-white/80">
            {previousImpact.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/gallery?year=2025" variant="outlineLight">
              2025 gallery
            </Button>
            <Button href="/experiences" variant="ghost" className="text-white hover:bg-white/10">
              All editions
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-red py-20 text-white">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl font-bold sm:text-5xl">
            The 2026 gathering is next
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            {nextEdition?.statement} Come ready to participate, not to watch a
            production.
          </p>
          <div className="mt-8">
            <Button href="/experience/2026" variant="inverse">
              The 2026 experience
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
