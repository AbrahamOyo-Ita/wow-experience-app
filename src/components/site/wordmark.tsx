import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex flex-col leading-none",
        inverted ? "text-white" : "text-ink",
      )}
    >
      <span className="font-display text-[1.2rem] tracking-normal md:text-[1.35rem]">
        Wonders of Worship
      </span>
      {!compact ? (
        <span
          className={cn(
            "mt-0.5 text-[0.65rem] font-semibold tracking-[0.18em] uppercase",
            inverted ? "text-white/70" : "text-muted",
          )}
        >
          Experience
        </span>
      ) : null}
    </Link>
  );
}
