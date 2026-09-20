import type { Metadata } from "next";
import Image from "next/image";
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
      {/* Hero Intro Banner - THE WHY BEHIND WOW */}
      <section className="relative min-h-[70vh] overflow-hidden bg-ink text-white flex items-center">
        <Image
          src="/images/THE WHY BEHIND WOW.jpeg"
          alt="The why behind WOW Experience"
          fill
          sizes="100vw"
          className="object-cover object-[center_28%] opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
        <div className="relative z-10 container-site py-24 md:py-32 md:max-w-3xl">
          <SlideUp>
            <span className="text-xs font-bold uppercase tracking-widest text-red-soft">
              THE WHY BEHIND WOW
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl uppercase">
              WE GATHER TO MAKE <AnimatedHighlight className="text-red">JESUS</AnimatedHighlight> VISIBLE
            </h1>
            <p className="mt-6 text-white/90 text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
              WOW exists to bring hearts together in authentic worship, create room for genuine encounters with God, and raise a generation that carries His presence beyond the gathering.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <HoverCard scale={1.03}>
                <Button href="#values" variant="outlineLight">
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
      </section>

      {/* Values Section */}
      <section id="values" className="bg-paper py-20 sm:py-24 border-y border-border/40">
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

          <StaggerContainer staggerDelay={0.15} className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {organizingTeam.map((person) => (
              <StaggerItem key={person.name}>
                <HoverCard lift={-6} className="group overflow-hidden rounded-2xl border border-border bg-paper shadow-2xs">
                  <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-ink">
                    <Image
                      src={person.imageSrc}
                      alt={person.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className={`object-cover ${person.imagePosition ?? "object-top"} ${person.imageScale ?? "scale-135 sm:scale-140 group-hover:scale-150"} grayscale transition-all duration-500 group-hover:grayscale-0`}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold text-ink">{person.name}</h3>
                    <p className="text-xs font-semibold text-red uppercase tracking-wider mt-1">{person.role}</p>
                    <p className="mt-3 text-xs text-muted leading-relaxed font-light">{person.bio}</p>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-red-soft">
              Maiden Chapter &bull; {previousImpact.year}
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-5xl uppercase">
              Theme: {previousImpact.theme}
            </h2>
            <p className="mt-1 text-sm font-semibold tracking-wider text-red-soft uppercase">
              Scripture: {previousImpact.scripture}
            </p>
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
