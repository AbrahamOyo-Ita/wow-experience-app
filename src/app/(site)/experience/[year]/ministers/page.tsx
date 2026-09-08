import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Button } from "@/components/ui/button";
import { getEditionBySlug, getEditionByYear } from "@/data/editions";
import { getMinistersByEdition } from "@/data/ministers";

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
  if (!edition) return { title: "Ministers" };
  return {
    title: `Ministers | ${edition.shortName}`,
    description: `The ministers serving ${edition.name}.`,
  };
}

export default async function MinistersPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const edition = getEditionBySlug(year) ?? getEditionByYear(Number(year));
  if (!edition) notFound();

  const ministers = getMinistersByEdition(edition.id);
  const unpublished = edition.status === "draft";
  const upcoming = edition.status === "published" || edition.status === "live";

  return (
    <PageShell>
      <PageIntro
        title={unpublished ? `${edition.year} ministers are not published` : "A small team for a focused day"}
        lede={
          unpublished
            ? "The next line-up will be named after the 2026 gathering."
            : ministers.length
              ? "These people serve the room, not a platform brand. Come ready to sing with them, not to watch them."
              : `Minister names for ${edition.year} are not listed here. The day still belonged to the congregation.`
        }
      />

      {ministers.length > 0 ? (
        <section className="container-site pb-24">
          <div className="grid gap-x-8 gap-y-16 md:grid-cols-12">
            {ministers.map((minister, index) => {
              const wide = index % 5 === 0 || index % 5 === 3;
              return (
                <article
                  key={minister.id}
                  className={wide ? "md:col-span-7" : "md:col-span-5 md:mt-10"}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-ink">
                    <Image
                      src={minister.imageSrc}
                      alt={minister.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="object-cover grayscale"
                    />
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-semibold">{minister.name}</h2>
                  <p className="mt-1 text-sm text-red">{minister.role}</p>
                  <p className="mt-4 max-w-md text-muted">{minister.bio}</p>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="container-site pb-24">
          <Button href="/experience/2026">Back to 2026</Button>
        </section>
      )}

      {upcoming ? (
        <section className="bg-red py-20 text-white">
          <div className="container-narrow text-center">
            <h2 className="font-display text-3xl font-bold sm:text-5xl">
              Join them in the room
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              RSVP for {edition.year} and we will remind you before doors open.
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
