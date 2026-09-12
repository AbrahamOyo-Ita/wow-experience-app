import { notFound } from "next/navigation";
import { listPublishedNewsletters } from "@/actions/public";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { formatDateTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const newsletter = (await listPublishedNewsletters()).find((item) => item.slug === slug);
  return {
    title: newsletter?.title ?? "Newsletter",
    description: newsletter?.excerpt ?? "Wonders of Worship Experience newsletter.",
  };
}

export default async function NewsletterReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const newsletter = (await listPublishedNewsletters()).find((item) => item.slug === slug);
  if (!newsletter) notFound();

  return (
    <PageShell>
      <PageIntro title={newsletter.title} lede={newsletter.excerpt || newsletter.subject} />
      <p className="container-site -mt-8 pb-8 text-xs font-semibold uppercase tracking-wide text-muted">
        {newsletter.publishedAt ? formatDateTime(newsletter.publishedAt) : "Newsletter"}
      </p>
      <article className="container-site max-w-3xl whitespace-pre-wrap pb-20 text-base leading-8 text-ink">
        {newsletter.body}
      </article>
    </PageShell>
  );
}
