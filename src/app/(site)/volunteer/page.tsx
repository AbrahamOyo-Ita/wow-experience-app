import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { VolunteerForm } from "@/components/volunteer/volunteer-form";
import { VolunteerStatusBadge } from "@/components/ui/status-badge";
import { getCurrentEdition } from "@/data/editions";
import { getTeamsByEdition } from "@/data/content";
import { volunteerFaqs } from "@/data/faqs";
import type { VolunteerStatus } from "@/types";
import { FadeIn, SlideUp, ScaleIn, StaggerContainer, StaggerItem, HoverCard } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Volunteer | Wonders of Worship Experience",
  description:
    "Serve the Wonders of Worship gathering. Volunteer for hospitality, worship, media, prayer, or logistics.",
};

const statusSamples: VolunteerStatus[] = [
  "submitted",
  "under_review",
  "accepted",
  "waitlisted",
  "declined",
];

export default function VolunteerPage() {
  const edition = getCurrentEdition();
  const teams = getTeamsByEdition(edition.id);
  const totalPlaces = teams.reduce((sum, team) => sum + team.capacity, 0);

  return (
    <PageShell>
      {/* Intro Header Section */}
      <section className="container-site grid gap-10 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
        <ScaleIn className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-paper shadow-md">
          <Image
            src="/images/WOW Workforce Design4.png"
            alt="Join the Workforce Flyer"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-contain"
          />
        </ScaleIn>
        
        <SlideUp delay={0.15}>
          <span className="text-xs font-bold uppercase tracking-widest text-red">Service Teams</span>
          <h1 className="mt-2 max-w-xl font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
            Serve the <span className="text-red">Gathering</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted font-light">
            Behind every seamless gathering are dedicated hearts serving in hospitality, prayer, media, and logistics. Join a team and help prepare the way.
          </p>

          <StaggerContainer staggerDelay={0.1} delay={0.3} className="mt-8 grid gap-4 sm:grid-cols-3">
            <StaggerItem>
              <HoverCard lift={-3} className="rounded-xl border border-border bg-white p-4 shadow-2xs">
                <p className="font-display text-3xl font-bold text-red">{teams.length}</p>
                <p className="mt-1 text-xs font-medium text-muted uppercase tracking-wider">Service Teams</p>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard lift={-3} className="rounded-xl border border-border bg-white p-4 shadow-2xs">
                <p className="font-display text-3xl font-bold text-red">{totalPlaces}</p>
                <p className="mt-1 text-xs font-medium text-muted uppercase tracking-wider">Available Positions</p>
              </HoverCard>
            </StaggerItem>

            <StaggerItem>
              <HoverCard lift={-3} className="rounded-xl border border-border bg-white p-4 shadow-2xs">
                <p className="font-display text-3xl font-bold text-red">Direct</p>
                <p className="mt-1 text-xs font-medium text-muted uppercase tracking-wider">Team Onboarding</p>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        </SlideUp>
      </section>

      {/* Teams Grid */}
      <section className="bg-paper py-20 border-y border-border/40">
        <div className="container-site">
          <FadeIn>
            <span className="text-xs font-bold uppercase tracking-widest text-red">Choose Your Calling</span>
            <h2 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl text-ink">
              Explore Volunteer Teams
            </h2>
            <p className="mt-4 max-w-xl text-muted text-base">
              Select the team that matches your gifts and commitment. Hospitality is open for all first-time volunteers.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <StaggerContainer staggerDelay={0.12} className="grid gap-4 sm:grid-cols-2">
              {teams.map((team) => (
                <StaggerItem key={team.id}>
                  <HoverCard lift={-4} className="h-full rounded-2xl border border-border bg-white p-6 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-2xl font-bold text-ink">{team.name}</h3>
                      <span className="rounded-full bg-red/10 border border-red/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red">
                        {team.capacity} places
                      </span>
                    </div>
                    <p className="mt-3 text-muted text-sm leading-relaxed">{team.description}</p>
                    <p className="mt-4 border-t border-border/60 pt-3 text-xs font-semibold text-ink">
                      {team.expectation}
                    </p>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <SlideUp delay={0.2} className="h-fit rounded-2xl border border-border bg-white p-6 shadow-2xs">
              <h3 className="font-display text-2xl font-bold text-ink">
                What Matters Most
              </h3>
              <p className="mt-3 text-muted text-sm leading-relaxed">
                Punctuality, reverence, and a joyful heart. When you volunteer, you facilitate an environment where others can encounter God.
              </p>
              <p className="mt-4 text-muted text-sm leading-relaxed">
                Team briefings and updates are communicated directly via WhatsApp and Email.
              </p>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="bg-paper pb-20">
        <div className="container-site">
          <SlideUp>
            <span className="text-xs font-bold uppercase tracking-widest text-red">Application</span>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl text-ink">
              Apply to Serve ({edition.year})
            </h2>
            <p className="mt-4 max-w-xl text-muted text-base">
              Complete the intake form below to submit your application. No registration fee required.
            </p>
          </SlideUp>

          <div className="mt-10">
            <VolunteerForm editionId={edition.id} teams={teams} />
          </div>
        </div>
      </section>

      {/* Status Labels */}
      <section className="bg-paper pb-16 border-b border-border/40">
        <div className="container-site">
          <FadeIn>
            <h3 className="font-display text-2xl font-bold text-ink">
              Application Status Guidelines
            </h3>
            <p className="mt-2 max-w-xl text-muted text-sm">
              Your confidential status indicator will update in your account as team leaders review applications.
            </p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {statusSamples.map((status) => (
                <li key={status}>
                  <VolunteerStatusBadge status={status} />
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white py-20">
        <div className="container-site">
          <FadeIn>
            <span className="text-xs font-bold uppercase tracking-widest text-red">Volunteer Support</span>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl text-ink">
              Volunteer Questions
            </h2>
          </FadeIn>

          <StaggerContainer staggerDelay={0.1} className="mt-10 max-w-3xl space-y-4">
            {volunteerFaqs.map((item) => (
              <StaggerItem key={item.id}>
                <details className="group rounded-xl border border-border bg-paper p-5 shadow-2xs">
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
    </PageShell>
  );
}
