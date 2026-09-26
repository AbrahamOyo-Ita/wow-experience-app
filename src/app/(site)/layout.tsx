import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { RsvpModalHost } from "@/components/rsvp/host";
import { AnalyticsTracker } from "@/components/site/analytics-tracker";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsTracker />
      {children}
      <SiteFooter />
      <RsvpModalHost />
    </>
  );
}

export function InnerChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}
