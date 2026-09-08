import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { VolunteerForm } from "@/components/volunteer/volunteer-form";
import { VolunteerStatusBadge } from "@/components/ui/status-badge";
import { getCurrentEdition } from "@/data/editions";
import { getTeamsByEdition } from "@/data/content";
import { volunteerFaqs } from "@/data/faqs";
import type { VolunteerStatus } from "@/types";

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Serve Wonders of Worship Experience 2026. Apply for hospitality, worship, media, prayer or logistics.",
};

const statusSamples: VolunteerStatus[] = [
  "submitted",
  "under_review",
  "accepted",
  "waitlisted",
  "declined",
];

export default function VolunteerPage() {
  const edition = getCurrentEdition();
  const teams = getTeamsByEdition(edition.id);
  const totalPlaces = teams.reduce((sum, team) => sum + team.capacity, 0);

  return (
    <PageShell>
      <section className="container-site grid gap-10 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-paper shadow-sm shadow-ink/10">
          <Image
            src="/images/volunteer-serve.jpg"
            alt="Volunteers preparing the hall"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="max-w-xl font-display text-5xl leading-none text-ink sm:text-7xl">
            Serve the <span className="text-red">gathering</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Help people arrive, sing, pray and leave well. Apply if you can keep
            a clear commitment.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-white p-4">
              <p className="font-display text-3xl leading-none text-red">{teams.length}</p>
              <p className="mt-1 text-sm text-muted">serving teams</p>
            </div>
            <div className="rounded-md border border-border bg-white p-4">
              <p className="font-display text-3xl leading-none text-red">{totalPlaces}</p>
              <p className="mt-1 text-sm text-muted">planned places</p>
            </div>
            <div className="rounded-md border border-border bg-white p-4">
              <p className="font-display text-3xl leading-none text-red">Review</p>
              <p className="mt-1 text-sm text-muted">before group access</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper py-20">
        <div className="container-site">
          <h2 className="font-display text-4xl leading-none sm:text-6xl">
            Pick a <span className="text-red">team</span>
          </h2>
          <p className="mt-4 max-w-xl text-muted">
            Choose the team that fits how you already serve. If unsure, start
            with hospitality.
          </p>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <ul className="grid gap-4 sm:grid-cols-2">
              {teams.map((team) => (
                <li key={team.id} className="rounded-md border border-border bg-white p-5">
                  <h3 className="font-display text-3xl leading-none">{team.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-red">
                    {team.status === "open" ? "Open" : "Closed"} / {team.capacity} places
                  </p>
                  <p className="mt-2 max-w-2xl text-muted">{team.description}</p>
                  <p className="mt-4 border-t border-border pt-3 text-sm text-ink">
                    {team.expectation}
                  </p>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-md border border-border bg-white p-6">
              <h3 className="font-display text-4xl leading-none">
                What <span className="text-red">matters</span>
              </h3>
              <p className="mt-3 text-muted">
                Arrive when your team is called. Stay through close unless
                agreed otherwise. Keep the room calm.
              </p>
              <p className="mt-4 text-muted">
                Briefings go by WhatsApp and email. Both consents confirm your
                placement.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-paper pb-20">
        <div className="container-site">
          <h2 className="font-display text-4xl leading-none sm:text-6xl">
            Apply to <span className="text-red">serve</span>
          </h2>
          <p className="mt-4 max-w-xl text-muted">
            Tell us who you are and how you can serve {edition.shortName}. No
            fee. No public volunteer roll.
          </p>
          <div className="mt-10">
            <VolunteerForm editionId={edition.id} teams={teams} />
          </div>
        </div>
      </section>

      <section className="bg-paper pb-16">
        <div className="container-site">
          <h2 className="font-display text-4xl leading-none">
            Application <span className="text-red">labels</span>
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            You may see one of these after review. They are not public.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {statusSamples.map((status) => (
              <li key={status}>
                <VolunteerStatusBadge status={status} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-site">
          <h2 className="font-display text-4xl leading-none sm:text-6xl">
            Before you <span className="text-red">apply</span>
          </h2>
          <div className="mt-10 max-w-3xl">
            {volunteerFaqs.map((item) => (
              <details key={item.id} className="border-t border-border py-5 last:border-b">
                <summary className="cursor-pointer font-display text-3xl leading-none">
                  {item.question}
                </summary>
                <p className="mt-3 max-w-2xl text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
