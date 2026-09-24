import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { organizingTeam, previousImpact, values } from "@/data/content";
import { getEditionByYear } from "@/data/editions";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem, HoverCard, AnimatedHighlight } from "@/components/ui/motion";

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
        <div className="relative z-10 container-site py-24 md:py-32">
          <div className="max-w-3xl">
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
                  <Button href="/gallery" variant="ghost" className="text-white hover:bg-white/10">
                    Browse photo gallery
                  </Button>
                </HoverCard>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Origin Story Section - WHERE THE STORY BEGAN */}
      <section className="bg-white py-16 sm:py-24 border-b border-border/40">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Text Content */}
            <div className="lg:col-span-7">
              <FadeIn>
                <span className="text-xs font-bold uppercase tracking-widest text-red">
                  Our Origins
                </span>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-5xl text-ink uppercase">
                  Where the Story Began
                </h2>
                <p className="mt-6 text-lg text-ink/90 font-light leading-relaxed">
                  WOW Experience was birthed by the Teens and Children’s Ministry of Sanctified Mount Zion Church as an expression of worship and a desire to see lives encounter God.
                </p>
                <p className="mt-4 text-base text-muted leading-relaxed font-light">
                  From those beginnings, the vision has continued to grow, bringing generations together in worship and creating moments that leave lasting testimonies.
                </p>
              </FadeIn>
            </div>

            {/* Logo Side */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <FadeIn>
                <HoverCard lift={-4} className="relative flex items-center justify-center rounded-3xl border border-border/60 bg-paper p-8 shadow-xs">
                  <div className="relative aspect-square w-48 sm:w-60 max-w-full overflow-hidden">
                    <Image
                      src="/images/smzc-children-teens-logo.webp"
                      alt="Teens and Children's Ministry of Sanctified Mount Zion Church Logo"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 200px, 240px"
                    />
                  </div>
                </HoverCard>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="bg-paper py-20 sm:py-24 border-b border-border/40">
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
              Stewards of the Vision
            </h2>
            <p className="mt-4 max-w-xl text-muted text-base">
              The core team upholding vision, operations, and guest experience across our annual editions.
            </p>
          </FadeIn>

          <StaggerContainer staggerDelay={0.15} className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {organizingTeam.map((person) => (
              <StaggerItem key={person.name}>
                <HoverCard lift={-6} className="group overflow-hidden rounded-2xl border border-border bg-paper shadow-2xs">
                  <div className="relative aspect-[3/4] overflow-hidden bg-ink">
                    <Image
                      src={person.imageSrc}
                      alt={person.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold text-ink">{person.name}</h3>
                    <p className="text-xs font-semibold text-red uppercase tracking-wider mt-1">{person.role}</p>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Previous Impact / Maiden Chapter Section */}
      <section className="bg-paper py-20 sm:py-28 border-t border-border/40">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7">
              <FadeIn>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-red">
                    Maiden Chapter &bull; {previousImpact.year}
                  </span>
                  <span className="rounded-full bg-red/10 px-3 py-1 text-xs font-semibold text-red">
                    {previousImpact.scripture}
                  </span>
                </div>

                <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl text-ink">
                  Theme: <span className="text-red">{previousImpact.theme}</span>
                </h2>

                <p className="mt-5 text-lg leading-relaxed text-muted font-light max-w-2xl">
                  {previousImpact.summary}
                </p>

                <div className="mt-8 grid gap-4">
                  {previousImpact.notes.map((note) => (
                    <div
                      key={note}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-white p-4 shadow-2xs"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red/10 text-red text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-sm font-medium text-ink/90 leading-snug">{note}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <HoverCard scale={1.03} className="inline-block">
                    <Button href="/gallery?year=2025" variant="primary">
                      Browse 2025 Photo Gallery
                    </Button>
                  </HoverCard>
                </div>
              </FadeIn>
            </div>

            {/* Right Image Showcase Column */}
            <div className="lg:col-span-5">
              <FadeIn>
                <HoverCard lift={-4} className="relative overflow-hidden rounded-3xl border border-border/80 bg-white p-2.5 shadow-md">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink">
                    <Image
                      src="/images/gallery-gathering.jpg"
                      alt="The 2025 congregation"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-medium">
                      <span className="rounded-full bg-ink/80 px-3 py-1 backdrop-blur-xs">
                        2025 Gathering Archive
                      </span>
                      <span className="text-white/80">Photo Highlights</span>
                    </div>
                  </div>
                </HoverCard>
              </FadeIn>
            </div>
          </div>
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
                <Button href="/volunteer" variant="inverse">
                  Volunteer with Us
                </Button>
              </HoverCard>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageShell>
  );
}
