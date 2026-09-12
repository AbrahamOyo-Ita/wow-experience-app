import Link from "next/link";
import { listPublishedNewsletters } from "@/actions/public";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Newsletters",
  description: "Read published Wonders of Worship Experience newsletters.",
};

export default async function NewslettersPage() {
  const newsletters = await listPublishedNewsletters();

  return (
    <PageShell>
      <PageIntro
        title="Published updates"
        lede="Edition announcements, worship notes, and community updates for subscribers."
      />
      <div className="container-site grid gap-4 pb-20">
        {newsletters.length ? (
          newsletters.map((newsletter) => (
            <article key={newsletter.id} className="border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {newsletter.publishedAt ? formatDateTime(newsletter.publishedAt) : "Published"}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink">
                <Link href={`/newsletters/${newsletter.slug}`}>{newsletter.title}</Link>
              </h2>
              {newsletter.excerpt ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{newsletter.excerpt}</p>
              ) : null}
              <Button href={`/newsletters/${newsletter.slug}`} variant="link" className="mt-4">
                Read newsletter
              </Button>
            </article>
          ))
        ) : (
          <div className="border border-border bg-white p-6 text-sm text-muted">
            No newsletters have been published yet.
          </div>
        )}
      </div>
    </PageShell>
  );
}
