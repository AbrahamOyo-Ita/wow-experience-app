import type { Metadata } from "next";
import { PoloDetails } from "@/components/polo/polo-details";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Official Polo Merch | Wonders of Worship Experience",
  description:
    "Order the official Wonders of Worship Experience Resound Polo in purple, red, black, or white.",
};

export default function PoloPage() {
  return (
    <PageShell>
      <PoloDetails />
    </PageShell>
  );
}
