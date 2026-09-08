import Link from "next/link";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <PageIntro
        title="This page is not here"
        lede="The link may be old, or the address may have moved. The 2026 gathering and the rest of the site are still available."
      />
      <section className="container-site pb-24">
        <div className="flex flex-wrap gap-4">
          <Button href="/">Home</Button>
          <Button href="/experience/2026" variant="outlineDark">
            2026 experience
          </Button>
          <Button href="/contact" variant="ghost">
            Contact
          </Button>
        </div>
        <p className="mt-10 max-w-xl text-sm text-muted">
          If you followed a reminder link and landed here, write to us through{" "}
          <Link href="/contact" className="font-semibold underline-offset-4 hover:underline">
            contact
          </Link>{" "}
          and we will send the correct page.
        </p>
      </section>
    </PageShell>
  );
}
