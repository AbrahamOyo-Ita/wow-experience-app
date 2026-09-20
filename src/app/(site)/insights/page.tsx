import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { InsightsSearchForm } from "@/components/insights/search-form";
import { articleCategories, getPublishedArticles } from "@/data/articles";
import { cn, paginate } from "@/lib/utils";

const PAGE_SIZE = 6;

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Writing on worship, gathering, service and the practical care of people who RSVP for Wonders of Worship Experience.",
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = firstParam(params.category) || "All";
  const query = firstParam(params.q).trim();
  const requestedPage = Number(firstParam(params.page)) || 1;

  const all = getPublishedArticles();
  const filtered = all.filter((article) => {
    const inCategory = category === "All" || article.category === category;
    if (!inCategory) return false;
    if (!query) return true;
    const hay = `${article.title} ${article.excerpt} ${article.body.join(" ")}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const showFeatured = requestedPage <= 1 && category === "All" && !query && all[0];
  const featured = showFeatured ? all[0] : null;
  const pool = featured ? filtered.filter((article) => article.id !== featured.id) : filtered;
  const totalPages = Math.max(1, Math.ceil(pool.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const { items } = paginate(pool, page, PAGE_SIZE);

  const hrefFor = (next: { category?: string; q?: string; page?: number }) => {
    const nextCategory = next.category ?? category;
    const nextQuery = next.q ?? query;
    const nextPage = next.page ?? 1;
    const search = new URLSearchParams();
    if (nextCategory && nextCategory !== "All") search.set("category", nextCategory);
    if (nextQuery) search.set("q", nextQuery);
    if (nextPage > 1) search.set("page", String(nextPage));
    const suffix = search.toString();
    return suffix ? `/insights?${suffix}` : "/insights";
  };

  return (
    <PageShell>
      <PageIntro
        title="Insights"
        lede="Short writing that prepares the room: worship, why we gather, how we serve, and how we treat your number."
      />

      {featured ? (
        <section className="container-site pb-16">
          <article className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="relative aspect-[16/10] overflow-hidden bg-ink">
              <Image
                src={featured.coverImageSrc}
                alt={featured.coverImageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-red">{featured.category}</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                <Link href={`/insights/${featured.slug}`} className="hover:underline">
                  {featured.title}
                </Link>
              </h2>
              <p className="mt-4 text-muted">{featured.excerpt}</p>
              <p className="mt-4 text-sm text-muted">
                {featured.author}, {featured.authorRole}
              </p>
            </div>
          </article>
        </section>
      ) : null}

      <section className="container-site pb-24">
        <div className="flex flex-col gap-8 border-t border-border pt-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Filter by theme</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {articleCategories.map((item) => (
                <Link
                  key={item}
                  href={hrefFor({ category: item, page: 1 })}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-semibold",
                    (category === item || (item === "All" && category === "All"))
                      ? "border-ink bg-ink text-white"
                      : "border-border text-ink hover:border-ink",
                  )}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <InsightsSearchForm query={query} category={category} />
        </div>

        {items.length === 0 && !featured ? (
          <p className="mt-16 max-w-xl text-muted">
            Nothing matches this filter yet. Clear search or choose another theme.
          </p>
        ) : items.length > 0 ? (
          <div className="mt-14 grid gap-12 md:grid-cols-12">
            {items.map((article, index) => (
              <article
                key={article.id}
                className={index === 0 ? "md:col-span-7" : "md:col-span-5"}
              >
                <Link href={`/insights/${article.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-paper">
                    <Image
                      src={article.coverImageSrc}
                      alt={article.coverImageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-red">{article.category}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold group-hover:underline">
                    {article.title}
                  </h2>
                  <p className="mt-3 text-muted">{article.excerpt}</p>
                </Link>
              </article>
            ))}
          </div>
        ) : null}

        {totalPages > 1 ? (
          <nav className="mt-16 flex items-center gap-4" aria-label="Insights pages">
            {page > 1 ? (
              <Link href={hrefFor({ page: page - 1 })} className="text-sm font-semibold underline">
                Previous
              </Link>
            ) : (
              <span className="text-sm text-muted">Previous</span>
            )}
            <p className="text-sm text-muted">
              Page {page} of {totalPages}
            </p>
            {page < totalPages ? (
              <Link href={hrefFor({ page: page + 1 })} className="text-sm font-semibold underline">
                Next
              </Link>
            ) : (
              <span className="text-sm text-muted">Next</span>
            )}
          </nav>
        ) : null}
      </section>
    </PageShell>
  );
}
