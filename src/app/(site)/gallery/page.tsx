import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { getAlbumsByEdition } from "@/data/content";
import { editions, getPublishedEditions } from "@/data/editions";
import { cn } from "@/lib/utils";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem, HoverCard } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Gallery Archives | Wonders of Worship Experience",
  description:
    "Reverent photograph archives and visual memories from annual Wonders of Worship gatherings.",
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const aspectClass = {
  landscape: "aspect-[16/10]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
} as const;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const yearParam = firstParam(params.year);
  const published = getPublishedEditions();
  const selected =
    yearParam === "all" || !yearParam
      ? "all"
      : published.find((edition) => edition.slug === yearParam)?.slug ?? "all";

  const selectedEdition =
    selected === "all" ? null : editions.find((edition) => edition.slug === selected);

  const albums = getAlbumsByEdition(
    selected === "all" ? "all" : (selectedEdition?.id ?? "all"),
  );

  const filters = [{ slug: "all", label: "All Editions Archive" }, ...published.map((edition) => ({
    slug: edition.slug,
    label: `${edition.year} Edition`,
  }))];

  return (
    <PageShell>
      <PageIntro
        title="Visual Archives & Memories"
        lede="Moments of reverent praise preserved across our annual gatherings. Full high-resolution photo archives open directly via Google Drive."
      />

      <section className="container-site pb-24">
        {/* Edition Filter Pills */}
        <FadeIn className="flex flex-wrap gap-2.5 border-b border-border/40 pb-8">
          {filters.map((filter) => (
            <HoverCard key={filter.slug} scale={1.03} lift={-2}>
              <Link
                href={filter.slug === "all" ? "/gallery" : `/gallery?year=${filter.slug}`}
                className={cn(
                  "rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all shadow-2xs",
                  selected === filter.slug
                    ? "border-red bg-red text-white shadow-sm"
                    : "border-border bg-white text-ink hover:border-red/40 hover:text-red",
                )}
              >
                {filter.label}
              </Link>
            </HoverCard>
          ))}
        </FadeIn>

        {albums.length === 0 ? (
          <SlideUp className="mt-16 max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
            <p className="text-muted text-base">
              No albums are published for this selection yet. Photos are curated and uploaded shortly after each gathering.
            </p>
          </SlideUp>
        ) : (
          <StaggerContainer staggerDelay={0.12} className="mt-12 grid gap-8 md:grid-cols-12">
            {albums.map((album, index) => (
              <StaggerItem
                key={album.id}
                className={
                  album.aspect === "portrait"
                    ? "md:col-span-4"
                    : album.aspect === "square"
                      ? "md:col-span-5"
                      : index === 0
                        ? "md:col-span-8"
                        : "md:col-span-7"
                }
              >
                <HoverCard lift={-6} className="group overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-2xs">
                  <div className={cn("relative overflow-hidden rounded-xl bg-ink", aspectClass[album.aspect])}>
                    <Image
                      src={album.coverSrc}
                      alt={album.coverAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  
                  <div className="p-2 pt-4">
                    <h2 className="font-display text-2xl font-bold text-ink">{album.title}</h2>
                    <p className="mt-1.5 text-muted text-sm leading-relaxed">{album.description}</p>
                    <p className="mt-2 text-xs font-semibold text-red uppercase tracking-wider">{album.photoCount} High-Res Photographs</p>
                    
                    <div className="mt-5">
                      {album.driveUrl ? (
                        <HoverCard scale={1.02} className="inline-block">
                          <Button href={album.driveUrl} variant="outlineDark">
                            View Album on Google Drive
                          </Button>
                        </HoverCard>
                      ) : (
                        <Button type="button" variant="outlineDark" disabled>
                          Publishing Soon
                        </Button>
                      )}
                    </div>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </PageShell>
  );
}
