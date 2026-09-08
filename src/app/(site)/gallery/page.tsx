import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { getAlbumsByEdition } from "@/data/content";
import { editions, getPublishedEditions } from "@/data/editions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A restrained photographic record of Wonders of Worship Experience. Full albums open in Google Drive when they are published.",
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

  const filters = [{ slug: "all", label: "All editions" }, ...published.map((edition) => ({
    slug: edition.slug,
    label: String(edition.year),
  }))];

  return (
    <PageShell>
      <PageIntro
        title="A quiet record"
        lede="These stills are for memory, not for a public roll of who attended. Full albums open in Google Drive when a folder has been published."
      />

      <section className="container-site pb-24">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter.slug}
              href={filter.slug === "all" ? "/gallery" : `/gallery?year=${filter.slug}`}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold",
                selected === filter.slug
                  ? "border-ink bg-ink text-white"
                  : "border-border text-ink hover:border-ink",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {albums.length === 0 ? (
          <p className="mt-16 max-w-xl text-muted">
            No albums are published for this edition yet. Check again after the
            gathering, or browse another year.
          </p>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-12">
            {albums.map((album, index) => (
              <article
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
                <div className={cn("relative overflow-hidden bg-ink", aspectClass[album.aspect])}>
                  <Image
                    src={album.coverSrc}
                    alt={album.coverAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover"
                  />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold">{album.title}</h2>
                <p className="mt-2 text-muted">{album.description}</p>
                <p className="mt-1 text-sm text-muted">{album.photoCount} photographs</p>
                <div className="mt-4">
                  {album.driveUrl ? (
                    <Button href={album.driveUrl} variant="outlineDark">
                      Open in Drive
                    </Button>
                  ) : (
                    <Button type="button" variant="outlineDark" disabled>
                      Album not published
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
