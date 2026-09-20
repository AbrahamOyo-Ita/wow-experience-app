import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Wordmark({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href="/" className="inline-flex items-center gap-3 group">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden">
        <Image
          src={
            inverted
              ? "/images/wow-logo-white.webp"
              : "/images/wow-logo-black.webp"
          }
          alt="Wonders of Worship Logo"
          fill
          sizes="72px"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
      <div
        className={cn(
          "flex flex-col leading-none transition-colors",
          inverted ? "text-white" : "text-ink",
        )}
      >
        <span className="font-display text-[1.15rem] font-bold tracking-tight md:text-[1.3rem]">
          Wonders of Worship
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-0.5 text-[0.62rem] font-bold tracking-[0.18em] uppercase",
              inverted ? "text-white/75" : "text-red",
            )}
          >
            Experience
          </span>
        ) : null}
      </div>
    </Link>
  );
}
