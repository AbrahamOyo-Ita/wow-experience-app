import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Website terms for Wonders of Worship Experience: invitation, RSVP, content and acceptable use.",
};

export default function TermsPage() {
  return (
    <PageShell>
      <PageIntro
        title="Website terms"
        lede={`${SITE.organizationName} publishes this site as an invitation to an annual gathering. These terms are short on purpose.`}
      />

      <article className="container-narrow space-y-10 pb-24 text-lg leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">The invitation</h2>
          <p className="mt-3">
            Pages, dates, ministers and venue notes describe a planned gathering.
            Details can change. The confirmed address and timing are sent to
            people who RSVP. An RSVP is not a ticket, a contract of entry, or
            attendance.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Your use of the site</h2>
          <p className="mt-3">
            Use the forms honestly. Do not submit other people&apos;s details without
            their knowledge. Do not attempt to scrape, bulk-export or republish
            contact information. Event-day check-in is for people physically at
            the venue.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Content</h2>
          <p className="mt-3">
            Writing, photographs and marks on this site belong to{" "}
            {SITE.organizationName} or to the people who licensed them to us.
            You may share links. You may not copy articles or images into other
            products as if they were your own.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Volunteer applications</h2>
          <p className="mt-3">
            Applying does not guarantee a place. We may accept, waitlist or
            decline an application. Serving is unpaid unless we say otherwise in
            writing. Volunteers remain responsible for their own travel and
            conduct.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Liability</h2>
          <p className="mt-3">
            The gathering is a worship service, not a ticketed entertainment
            product. We take care with planning and communication. We are not
            liable for travel costs if the venue or timetable is updated, provided
            we notify RSVPs through the channels they chose.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Contact</h2>
          <p className="mt-3">
            Privacy practices are described on the privacy page. For anything
            else, write to {SITE.contactEmail}.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
