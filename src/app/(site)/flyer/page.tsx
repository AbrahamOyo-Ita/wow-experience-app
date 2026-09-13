import type { Metadata } from "next";
import { FlyerGenerator } from "@/components/flyer/flyer-generator";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Attending Flyer Studio | Wonders of Worship Experience",
  description:
    "Create and download a personalized Wonders of Worship Experience 2026 attending flyer.",
};

export default function FlyerPage() {
  return (
    <PageShell>
      <FlyerGenerator />
    </PageShell>
  );
}
