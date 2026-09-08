import { SiteHeader } from "@/components/site/header";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}

export function PageIntro({
  title,
  lede,
}: {
  title: string;
  lede?: string;
}) {
  return (
    <header className="container-site pb-12 pt-16 sm:pt-20">
      <h1 className="max-w-3xl font-display text-4xl font-bold sm:text-6xl">{title}</h1>
      {lede ? <p className="mt-5 max-w-2xl text-lg text-muted">{lede}</p> : null}
    </header>
  );
}
