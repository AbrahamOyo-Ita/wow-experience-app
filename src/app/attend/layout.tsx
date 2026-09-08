import Link from "next/link";
import { SITE } from "@/data/site";

export default function AttendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-white text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
          <Link
            href="/"
            className="text-[0.7rem] font-bold tracking-[0.16em] uppercase text-ink whitespace-nowrap hover:text-red transition-colors"
          >
            {SITE.eventSeriesName}
          </Link>
        </div>
      </header>
      <main className="px-4 py-8">{children}</main>
    </div>
  );
}
