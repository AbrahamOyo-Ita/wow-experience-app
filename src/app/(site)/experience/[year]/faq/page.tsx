import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Button } from "@/components/ui/button";
import { getEditionBySlug, getEditionByYear } from "@/data/editions";
import { getFaqsByEdition } from "@/data/faqs";

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
  if (!edition) return { title: "FAQ" };
  return {
    title: `FAQ | ${edition.shortName}`,
    description: `Practical questions for ${edition.name}: venue, timing, children, access and entry.`,
  };
}

export default async function ExperienceFaqPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const edition = getEditionBySlug(year) ?? getEditionByYear(Number(year));
  if (!edition) notFound();

  const faqs = getFaqsByEdition(edition.id);
  const unpublished = edition.status === "draft";
  const upcoming = edition.status === "published" || edition.status === "live";

  return (
    <PageShell>
      <PageIntro
        title={unpublished ? "Questions will open with the edition" : "Practical questions"}
        lede={
          unpublished
            ? "When 2027 is published, venue, timing and access notes will live here."
            : `Answers for ${edition.shortName}. If yours is missing, write through the contact page.`
        }
      />

      <section className="container-site pb-24">
        {faqs.length === 0 ? (
          <div>
            <p className="max-w-xl text-muted">
              There is no published FAQ for this edition. The 2026 questions
              cover how we gather, and they are a fair guide for what to expect.
            </p>
            <div className="mt-8">
              <Button href="/experience/2026/faq" variant="outlineDark">
                Read the 2026 FAQ
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl">
            {faqs.map((item) => (
              <details key={item.id} className="border-t border-border py-5 last:border-b">
                <summary className="cursor-pointer list-none font-display text-xl font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-6">
                    {item.question}
                    <span aria-hidden className="mt-1 text-red">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl pr-10 text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        )}
      </section>

      {upcoming ? (
        <section className="bg-paper py-16">
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold">Still coming?</h2>
            <p className="mt-3 text-muted">
              RSVP so we can send the venue note and reminders on a channel you
              approve.
            </p>
            <div className="mt-6">
              <OpenRsvpButton>I&apos;ll attend</OpenRsvpButton>
            </div>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
