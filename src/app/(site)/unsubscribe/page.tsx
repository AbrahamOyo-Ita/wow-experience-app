import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/site/page-shell";
import { UnsubscribeForm } from "@/components/unsubscribe/unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description:
    "Stop WhatsApp or email reminders from Wonders of Worship Experience. This does not delete an attendance record from a gathering you already attended.",
};

export default function UnsubscribePage() {
  return (
    <PageShell>
      <PageIntro
        title="Stop reminders"
        lede="Enter the email address or WhatsApp number we used, then choose which channel to stop. We will not add you to a new list by visiting this page."
      />
      <section className="container-site pb-24">
        <UnsubscribeForm />
        <p className="mt-10 max-w-xl text-sm text-muted">
          On WhatsApp you can also send STOP. Unsubscribing from reminders does
          not remove an attendance record from a gathering you already attended.
        </p>
      </section>
    </PageShell>
  );
}
