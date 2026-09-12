import type { Metadata } from "next";
import Image from "next/image";
import { Sparkles, Heart, Quote, Users, BookOpen, Clock, MapPin } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { organizingTeam, previousImpact, values } from "@/data/content";
import { getEditionByYear } from "@/data/editions";
import { FadeIn, SlideUp, ScaleIn, StaggerContainer, StaggerItem, HoverCard, AnimatedHighlight } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "About | Wonders of Worship Experience",
  description:
    "The vision, core values, organizing team, and multi-edition platform behind Wonders of Worship Experience.",
};

export default function AboutPage() {
  const nextEdition = getEditionByYear(2026);

  return (
    <PageShell>
      {/* Hero Intro Banner */}
      <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-red/25 blur-[120px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container-site relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-soft backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-red" />
              <span>About the Platform & Movement</span>
            </div>
          </FadeIn>

          <SlideUp delay={0.15}>
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
              An unhurried space for{" "}
              <AnimatedHighlight className="text-red">worship</AnimatedHighlight>
            </h1>
          </SlideUp>

          <FadeIn delay={0.3}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl font-light">
              Wonders of Worship Experience is an annual digital platform and congregational movement. 
              We exist to create room for believers across generations to behold Christ through Scripture, song, and quiet reverence.
            </p>
          </FadeIn>

          {/* Quick Metrics Bar */}
          <StaggerContainer staggerDelay={0.1} delay={0.4} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:max-w-3xl">
            <StaggerItem>
              <HoverCard lift={-4} scale={1.02} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Format</p>
                <p className="mt-1 text-base font-semibold text-white">Full Day Gathering</p>
                <p className="text-xs text-white/70">Congregational Worship</p>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard lift={-4} scale={1.02} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Pacing</p>
                <p className="mt-1 text-base font-semibold text-white">Unhurried Time</p>
                <p className="text-xs text-white/70">No Stage Rush</p>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard lift={-4} scale={1.02} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Anchor</p>
                <p className="mt-1 text-base font-semibold text-white">Scriptural Truth</p>
                <p className="text-xs text-white/70">Word-Centered</p>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard lift={-4} scale={1.02} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-white/60 font-medium">Platform</p>
                <p className="mt-1 text-base font-semibold text-white">Multi-Edition</p>
                <p className="text-xs text-white/70">Past, Present & Future</p>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* "Why We Gather" Section */}
      <section className="relative bg-gradient-to-b from-paper via-white to-white py-20 sm:py-28">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column */}
            <SlideUp className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red">
                <Heart className="h-3.5 w-3.5 fill-red/20 text-red" />
                <span>Our Heart & Purpose</span>
              </div>

              <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl text-ink">
                Why We Gather
              </h2>

              <div className="relative my-8 rounded-2xl border border-red/20 bg-white p-6 shadow-xs border-l-4 border-l-red sm:p-7">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-red/10" />
                <p className="relative z-10 text-lg leading-relaxed font-medium text-ink/90 italic">
                  &ldquo;Worship can easily turn into a structured production where songs end on a schedule and the room is rushed. 
                  We built Wonders of Worship around the opposite priority: a prepared room, clear scriptural grounding, and enough space to sing until hearts respond.&rdquo;
                </p>
              </div>

              <p className="max-w-2xl leading-relaxed text-muted text-base">
                This platform connects worshippers across annual editions. Whether exploring recordings from past years or registering for upcoming gatherings, the core mission remains simple: exalting Christ together.
              </p>

              {/* Feature Cards Grid */}
              <StaggerContainer staggerDelay={0.1} className="mt-8 grid gap-4 sm:grid-cols-3">
                <StaggerItem>
                  <HoverCard lift={-4} className="rounded-xl border border-border bg-white p-4 shadow-2xs">
                    <Users className="h-5 w-5 text-red" />
                    <h3 className="mt-3 font-semibold text-ink text-sm">Congregational Voice</h3>
                    <p className="mt-1 text-xs text-muted leading-snug">
                      Active participative worshippers, not spectators.
                    </p>
                  </HoverCard>
                </StaggerItem>

                <StaggerItem>
                  <HoverCard lift={-4} className="rounded-xl border border-border bg-white p-4 shadow-2xs">
                    <BookOpen className="h-5 w-5 text-red" />
                    <h3 className="mt-3 font-semibold text-ink text-sm">Scripture Centered</h3>
                    <p className="mt-1 text-xs text-muted leading-snug">
                      Grounded in scripture and earnest prayer.
                    </p>
                  </HoverCard>
                </StaggerItem>

                <StaggerItem>
                  <HoverCard lift={-4} className="rounded-xl border border-border bg-white p-4 shadow-2xs">
                    <Clock className="h-5 w-5 text-red" />
                    <h3 className="mt-3 font-semibold text-ink text-sm">Unhurried Pacing</h3>
                    <p className="mt-1 text-xs text-muted leading-snug">
                      Time to linger in God&apos;s presence without rush.
                    </p>
                  </HoverCard>
                </StaggerItem>
              </StaggerContainer>
            </SlideUp>

            {/* Right Column Visual */}
            <ScaleIn delay={0.2} className="lg:col-span-5">
              <div className="group relative">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-red/30 via-red/10 to-transparent blur-xl opacity-70 transition duration-500 group-hover:opacity-100" />
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink border border-ink/10 shadow-2xl lg:aspect-[5/6]">
                  <Image
                    src="/images/about-worship-hero.jpg"
                    alt="Congregation gathered in authentic worship"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/20 bg-ink/75 p-4 backdrop-blur-md text-white shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red text-white shadow-sm">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">Pure Congregational Worship</p>
                        <p className="text-xs text-white/75 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3 text-red-soft" />
                          <span>Annual Gathering Movement</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-paper py-20 sm:py-24 border-y border-border/40">
        <div className="container-site">
          <FadeIn>
            <span className="text-xs font-bold uppercase tracking-widest text-red">Core Commitments</span>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold sm:text-4xl text-ink">
              What We Refuse to Compromise
            </h2>
          </FadeIn>

          <StaggerContainer staggerDelay={0.12} className="mt-12 grid gap-8 md:grid-cols-2">
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <HoverCard lift={-4} className="h-full rounded-2xl border border-border bg-white p-6 shadow-2xs">
                  <h3 className="font-display text-2xl font-bold text-ink">{value.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted text-base">{value.body}</p>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="container-site">
          <FadeIn>
            <span className="text-xs font-bold uppercase tracking-widest text-red">Organizing Leadership</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-5xl text-ink">
              Stewards of the Gathering
            </h2>
            <p className="mt-4 max-w-xl text-muted text-base">
              The core team upholding vision, operations, and guest experience across our annual editions.
            </p>
          </FadeIn>

          <StaggerContainer staggerDelay={0.15} className="mt-12 grid gap-8 md:grid-cols-3">
            {organizingTeam.map((person) => (
              <StaggerItem key={person.name}>
                <HoverCard lift={-6} className="group overflow-hidden rounded-2xl border border-border bg-paper shadow-2xs">
                  <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                    <Image
                      src={person.imageSrc}
                      alt={person.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-2xl font-bold text-ink">{person.name}</h3>
                    <p className="text-sm font-semibold text-red">{person.role}</p>
                    <p className="mt-3 text-sm text-muted leading-relaxed">{person.bio}</p>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Previous Impact Banner */}
      <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
        <Image
          src="/images/gallery-gathering.jpg"
          alt="The 2025 congregation"
          fill
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="relative z-10 container-site">
          <SlideUp>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-soft">
              <span>Maiden Chapter &bull; {previousImpact.year}</span>
            </div>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-5xl">
              Theme: {previousImpact.theme}
            </h2>
            <p className="mt-5 max-w-xl text-lg text-white/85 font-light leading-relaxed">{previousImpact.summary}</p>
            <ul className="mt-8 max-w-lg space-y-3 text-white/80 text-sm">
              {previousImpact.notes.map((note) => (
                <li key={note} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <HoverCard scale={1.03}>
                <Button href="/gallery?year=2025" variant="outlineLight">
                  Browse 2025 photo gallery
                </Button>
              </HoverCard>
              <HoverCard scale={1.03}>
                <Button href="/experiences" variant="ghost" className="text-white hover:bg-white/10">
                  Explore all edition archives
                </Button>
              </HoverCard>
            </div>
          </SlideUp>
        </div>
      </section>

      {/* Upcoming Edition Call */}
      <section className="bg-red py-20 text-white">
        <div className="container-narrow text-center">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold sm:text-5xl">
              Join the Next Gathering
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90 text-lg font-light">
              {nextEdition?.statement} Reserve your place and be part of what God is doing through Wonders of Worship.
            </p>
            <div className="mt-8">
              <HoverCard scale={1.04} className="inline-block">
                <Button href="/experience/2026" variant="inverse">
                  Explore the 2026 Experience
                </Button>
              </HoverCard>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageShell>
  );
}
