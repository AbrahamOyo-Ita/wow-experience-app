import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { getPublishedEditions } from "@/data/editions";
import { formatLongDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Editions",
  description:
    "Published editions of Wonders of Worship Experience, with status for each annual gathering.",
};

const statusLabel: Record<string, string> = {
  published: "Upcoming",
  live: "Happening now",
  completed: "Completed",
  archived: "Archived",
  scheduled: "Scheduled",
};

export default function ExperiencesPage() {
  const editions = getPublishedEditions();

  return (
    <PageShell>
      <PageIntro
        title="Annual editions"
        lede="Wonders of Worship Experience is planned as a returning gathering, not a disposable event website. Each year reuses this home."
      />

      <section className="container-site pb-24">
        <ul>
          {editions.map((edition) => (
            <li key={edition.id} className="border-t border-border py-10 last:border-b">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-red">
                  {statusLabel[edition.status] ?? edition.status}
                </p>
                <p className="text-sm text-muted">
                  {formatLongDate(edition.startsAt, edition.timezone)}
                </p>
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                <Link href={`/experience/${edition.slug}`} className="hover:underline">
                  {edition.shortName}
                </Link>
              </h2>
              <p className="mt-3 max-w-2xl text-lg text-muted">{edition.theme}</p>
              <p className="mt-2 max-w-2xl text-muted">{edition.statement}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
