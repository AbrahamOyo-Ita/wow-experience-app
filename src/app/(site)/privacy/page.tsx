import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Wonders of Worship Experience collects consent, sends WhatsApp and email reminders, and treats RSVP versus attendance records.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageIntro
        title="Privacy"
        lede={`How we treat names, numbers and messages for ${SITE.eventSeriesName}. Policy version ${SITE.policyVersion}.`}
      />

      <article className="container-narrow space-y-10 pb-24 text-lg leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Who we are</h2>
          <p className="mt-3">
            {SITE.organizationName} organises an annual Christian gathering in
            Lagos. This website is the public invitation and the place where we
            record RSVPs, volunteer applications and enquiries. We are not a
            ticket marketplace and we do not sell lists.
          </p>
          <p className="mt-3">
            Questions about this policy: {SITE.contactEmail}.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Consent, not implied lists</h2>
          <p className="mt-3">
            We only send event reminders on a channel you approve. When you RSVP
            you choose WhatsApp, email, or both. Each channel is recorded
            separately. Declining the gathering does not add you to a list.
            Visiting the site does not count as consent.
          </p>
          <p className="mt-3">
            Volunteer applications require both WhatsApp and email consent
            because that is how placement is confirmed. Enquiries use the
            details you type so we can reply. We do not reuse an enquiry as an
            RSVP.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">WhatsApp and email are different</h2>
          <p className="mt-3">
            WhatsApp reminders are sent only if you grant WhatsApp consent and
            give a working Nigerian number. Email reminders are sent only if you
            grant email consent and give an address. Choosing one channel does
            not authorise the other.
          </p>
          <p className="mt-3">
            If WhatsApp delivery fails, we may fall back to email only when you
            also granted email consent. We will not invent a second channel.
            You can send STOP on WhatsApp, or use the unsubscribe page, at any
            time.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">RSVP is not attendance</h2>
          <p className="mt-3">
            An RSVP records your intention to come and how you want to be
            reminded. It is a gift to the planning team. It is not a ticket and
            it is not proof that you walked in.
          </p>
          <p className="mt-3">
            Attendance is recorded at the venue, usually by scanning a QR code
            on the event day. That record may include your name, occupation
            snapshot and the time you checked in. We keep RSVP and attendance
            as separate facts so a reminder list is never treated as a roll call.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">What we keep, and for how long</h2>
          <p className="mt-3">
            We keep contact details, consents, RSVPs, volunteer applications and
            attendance records for the edition they belong to, and for a limited
            time afterwards so we can send a thank-you and answer a legitimate
            follow-up. We do not keep data just in case for future years
            unless you RSVP again.
          </p>
          <p className="mt-3">
            Volunteer working groups are closed after the gathering. Unsubscribe
            and STOP requests are honoured for that channel going forward.
            Offline form attempts stored on your own device are yours until you
            retry or clear them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">No public attendee lists</h2>
          <p className="mt-3">
            We do not publish who RSVPed, who volunteered, or who checked in.
            The gallery is a photographic record of a room, not a directory of
            names. Admin tools that show people are restricted to authorised
            organisers and are not part of this public site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Your choices</h2>
          <p className="mt-3">
            You can update consent by RSVPing again, by writing to{" "}
            {SITE.contactEmail}, or by using the unsubscribe page. You can ask
            what we hold about you for a given edition. If you want a record
            deleted after the gathering, tell us and we will do so unless we
            must keep a minimal attendance log for a short operational reason.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
