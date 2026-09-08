import { Wordmark } from "@/components/site/wordmark";
import { SITE } from "@/data/site";

export default function AttendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-white text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between gap-4 px-4">
          <Wordmark compact />
          <p className="text-right text-[0.65rem] font-semibold leading-tight tracking-[0.12em] text-muted uppercase">
            {SITE.eventSeriesName}
          </p>
        </div>
      </header>
      <main className="px-4 py-8">{children}</main>
    </div>
  );
}
