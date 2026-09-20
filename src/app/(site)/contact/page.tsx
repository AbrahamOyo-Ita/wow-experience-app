import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { EnquiryForm } from "@/components/contact/enquiry-form";
import { SITE } from "@/data/site";
import { getCurrentEdition } from "@/data/editions";
import { SlideUp, ScaleIn, HoverCard } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Contact Us | Wonders of Worship Experience",
  description:
    "Get in touch with the Wonders of Worship Experience team regarding upcoming gatherings, volunteering, or enquiries.",
};

export default function ContactPage() {
  const edition = getCurrentEdition();

  return (
    <PageShell>
      <PageIntro
        title="Get in Touch"
        lede="Have a question about an upcoming gathering, volunteering, or venue access? Send us a direct message and our team will get back to you promptly."
      />

      <section className="container-site grid gap-16 pb-20 lg:grid-cols-[0.8fr_1.2fr]">
        <SlideUp>
          <h2 className="font-display text-2xl font-bold text-ink">{SITE.organizationName}</h2>
          <dl className="mt-6 space-y-5 text-sm">
            <div className="rounded-xl border border-border bg-white p-4 shadow-2xs">
              <dt className="text-xs uppercase font-bold tracking-wider text-muted">Email Inquiry</dt>
              <dd className="mt-1">
                <a href={`mailto:${SITE.contactEmail}`} className="font-semibold text-red hover:underline">
                  {SITE.contactEmail}
                </a>
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-white p-4 shadow-2xs">
              <dt className="text-xs uppercase font-bold tracking-wider text-muted">Phone & WhatsApp Support</dt>
              <dd className="mt-1 font-semibold text-ink">{SITE.whatsappDisplay}</dd>
            </div>
            <div className="rounded-xl border border-border bg-white p-4 shadow-2xs">
              <dt className="text-xs uppercase font-bold tracking-wider text-muted">Data & Privacy Policy</dt>
              <dd className="mt-1 font-medium text-muted">Version {SITE.policyVersion}</dd>
            </div>
          </dl>
          
          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Connect on Socials</p>
            <div className="flex flex-wrap gap-4 text-sm font-semibold">
              <a href={SITE.social.instagram} target="_blank" rel="noreferrer" className="text-ink hover:text-red transition-colors">
                Instagram &rarr;
              </a>
              <a href={SITE.social.youtube} target="_blank" rel="noreferrer" className="text-ink hover:text-red transition-colors">
                YouTube &rarr;
              </a>
              <a href={SITE.social.x} target="_blank" rel="noreferrer" className="text-ink hover:text-red transition-colors">
                X &rarr;
              </a>
              <a href={SITE.social.facebook} target="_blank" rel="noreferrer" className="text-ink hover:text-red transition-colors">
                Facebook &rarr;
              </a>
              <a href={SITE.social.tiktok} target="_blank" rel="noreferrer" className="text-ink hover:text-red transition-colors">
                TikTok &rarr;
              </a>
            </div>
          </div>
        </SlideUp>

        <ScaleIn delay={0.2} className="rounded-2xl border border-border bg-white p-8 shadow-2xs">
          <EnquiryForm />
        </ScaleIn>
      </section>

      <section className="bg-paper py-16 border-t border-border/40">
        <div className="container-site grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <SlideUp>
            <span className="text-xs font-bold uppercase tracking-widest text-red">Current Gathering Venue</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">Venue Information</h2>
            <p className="mt-4 max-w-md text-muted text-base leading-relaxed">
              {edition.venue.name} &bull; {edition.venue.city}, {edition.venue.country}.
            </p>
            <p className="mt-2 text-sm text-muted">{edition.venue.notes}</p>
            <div className="mt-6">
              <HoverCard scale={1.03} className="inline-block">
                <Button href={edition.venue.directionsUrl} variant="outlineDark">
                  Open directions on Google Maps
                </Button>
              </HoverCard>
            </div>
          </SlideUp>

          <ScaleIn delay={0.2} className="flex min-h-64 flex-col justify-center rounded-2xl border border-border bg-white p-8 shadow-2xs">
            <p className="text-sm font-bold text-ink uppercase tracking-wider">Address Details</p>
            <p className="mt-2 font-display text-xl font-bold text-ink">{edition.venue.address}</p>
            <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
              Sanctified Mount Zion Church, #25 Ibiono Street, Uyo, Akwa Ibom State.
            </p>
          </ScaleIn>
        </div>
      </section>
    </PageShell>
  );
}
