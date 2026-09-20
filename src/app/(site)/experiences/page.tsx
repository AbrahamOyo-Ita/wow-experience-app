import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { editions } from "@/data/editions";
import { formatLongDate } from "@/lib/utils";
import { StaggerContainer, StaggerItem, HoverCard } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Edition Archives | Wonders of Worship Experience",
  description:
    "Explore the timeline of past, current, and upcoming editions of the Wonders of Worship movement.",
};

const statusLabel: Record<string, string> = {
  published: "Current Edition",
  live: "Happening Now",
  completed: "Past Edition Archive",
  archived: "Archived",
  scheduled: "Scheduled",
  draft: "Upcoming Chapter",
};

export default function ExperiencesPage() {
  return (
    <PageShell>
      <PageIntro
        title="Movement Archives & Annual Editions"
        lede="Wonders of Worship is an enduring digital worship platform. Each annual chapter is preserved in our archives, honoring where God has led us while preparing room for future gatherings."
      />

      <section className="container-site pb-24">
        <StaggerContainer staggerDelay={0.15} className="space-y-8">
          {editions.map((edition) => (
            <StaggerItem key={edition.id}>
              <HoverCard lift={-4} scale={1.01} className="rounded-2xl border border-border bg-white p-8 shadow-2xs transition-all hover:border-red/40 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      edition.status === "published" || edition.status === "live"
                        ? "bg-red/10 text-red border border-red/20"
                        : edition.status === "completed"
                        ? "bg-ink/10 text-ink border border-ink/20"
                        : "bg-muted/15 text-muted border border-border"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        edition.status === "published" ? "bg-red animate-pulse" : "bg-current"
                      }`} />
                      {statusLabel[edition.status] ?? edition.status}
                    </span>
                    <span className="text-xs font-semibold text-muted tracking-wider uppercase">
                      {edition.year} Edition
                    </span>
                  </div>

                  <p className="text-sm font-medium text-muted">
                    {edition.isDatePlaceholder ? "Date to be announced" : formatLongDate(edition.startsAt, edition.timezone)}
                  </p>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-8">
                    <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
                      <Link href={`/experience/${edition.slug}`} className="hover:text-red transition-colors">
                        {edition.name}
                      </Link>
                    </h2>
                    <p className="mt-2 italic text-xl text-red font-semibold">Theme: &ldquo;{edition.theme}&rdquo;</p>
                    <p className="mt-3 text-muted text-base leading-relaxed">{edition.description}</p>
                  </div>

                  <div className="md:col-span-4 md:text-right">
                    <Link
                      href={`/experience/${edition.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-red shadow-2xs"
                    >
                      <span>Explore Edition Details</span> &rarr;
                    </Link>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </PageShell>
  );
}
