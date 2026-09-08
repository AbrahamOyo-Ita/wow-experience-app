import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { RsvpModalHost } from "@/components/rsvp/host";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
