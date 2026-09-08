import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { ShareButton } from "@/components/insights/share-button";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { getArticleBySlug, getPublishedArticles, getRelatedArticles } from "@/data/articles";
import { formatShortDate } from "@/lib/utils";

export function generateStaticParams() {
  return getPublishedArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Insight" };
  return {
    title: article.seoTitle,
    description: article.seoDescription,
  };
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article.slug, 2);

  return (
    <PageShell>
      <article>
        <header className="container-site pb-10 pt-16 sm:pt-20">
          <p className="text-sm font-semibold text-red">{article.category}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold sm:text-6xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{article.excerpt}</p>
          <p className="mt-6 text-sm text-muted">
            {article.author}, {article.authorRole} ·{" "}
            {formatShortDate(article.publishedAt, "Africa/Lagos")}
          </p>
        </header>

        <div className="container-site">
          <div className="relative aspect-[16/9] overflow-hidden bg-ink">
            <Image
              src={article.coverImageSrc}
              alt={article.coverImageAlt}
              fill
              priority
              sizes="(max-width: 1120px) 100vw, 1120px"
              className="object-cover"
            />
          </div>
        </div>

        <div className="container-narrow py-14">
          <div className="space-y-6 text-lg leading-relaxed text-ink">
            {article.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-12">
            <ShareButton title={article.title} />
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="bg-paper py-16">
          <div className="container-site">
            <h2 className="font-display text-3xl font-bold">Keep reading</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              {related.map((item) => (
                <Link key={item.id} href={`/insights/${item.slug}`} className="group">
                  <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                    <Image
                      src={item.coverImageSrc}
                      alt={item.coverImageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-red">{item.category}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold group-hover:underline">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-red py-20 text-white">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl font-bold sm:text-5xl">
            Come and behold Him
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            The writing is preparation. The gathering is the point. RSVP for
            Wonders of Worship Experience 2026.
          </p>
          <div className="mt-8">
            <OpenRsvpButton variant="inverse">I&apos;ll attend</OpenRsvpButton>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
