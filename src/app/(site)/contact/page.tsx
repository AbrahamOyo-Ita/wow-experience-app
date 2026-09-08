import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { EnquiryForm } from "@/components/contact/enquiry-form";
import { SITE } from "@/data/site";
import { getCurrentEdition } from "@/data/editions";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Write to the Wonders of Worship Experience team about the gathering, volunteering, access or this website.",
};

export default function ContactPage() {
  const edition = getCurrentEdition();

  return (
    <PageShell>
      <PageIntro
        title="Write to us"
        lede="Use this form for questions that are not answered on the FAQ. For event reminders, RSVP first so we only message you on a channel you approve."
      />

      <section className="container-site grid gap-16 pb-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="font-display text-2xl font-semibold">{SITE.organizationName}</h2>
          <dl className="mt-6 space-y-5 text-sm">
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${SITE.contactEmail}`} className="font-semibold hover:underline">
                  {SITE.contactEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Phone / WhatsApp</dt>
              <dd className="mt-1 font-semibold">{SITE.whatsappDisplay}</dd>
            </div>
            <div>
              <dt className="text-muted">Policy version</dt>
              <dd className="mt-1">{SITE.policyVersion}</dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-col gap-3 text-sm font-semibold">
            <a href={SITE.social.instagram} className="hover:underline">
              Instagram
            </a>
            <a href={SITE.social.youtube} className="hover:underline">
              YouTube
            </a>
            <a href={SITE.social.x} className="hover:underline">
              X
            </a>
          </div>
        </div>
        <EnquiryForm />
      </section>

      <section className="bg-paper py-16">
        <div className="container-site grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <h2 className="font-display text-3xl font-bold">Venue</h2>
            <p className="mt-4 max-w-md text-muted">
              {edition.venue.name}. {edition.venue.city}, {edition.venue.country}.{" "}
              {edition.venue.notes}
            </p>
            <div className="mt-6">
              <Button href={edition.venue.directionsUrl} variant="outlineDark">
                Open directions
              </Button>
            </div>
          </div>
          <div className="flex min-h-72 flex-col justify-end border border-border bg-white p-8">
            <p className="text-sm font-semibold text-ink">{edition.venue.address}</p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Use the directions link for Sanctified Mount Zion Church, #25
              Ibiono Street, Uyo, Akwa Ibom State.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
