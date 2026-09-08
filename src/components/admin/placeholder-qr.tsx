import { cn } from "@/lib/utils";

export function PlaceholderQr({
  caption = "Placeholder check-in mark. This is not a WhatsApp login code.",
  className,
}: {
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={cn("grid gap-3", className)}>
      <div
        className="relative aspect-square w-full max-w-[220px] bg-[#d8d0d0]"
        aria-hidden
      >
        <svg viewBox="0 0 120 120" className="h-full w-full text-ink/70">
          <rect x="8" y="8" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
          <rect x="84" y="8" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
          <rect x="8" y="84" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
          <rect x="18" y="18" width="8" height="8" fill="currentColor" />
          <rect x="94" y="18" width="8" height="8" fill="currentColor" />
          <rect x="18" y="94" width="8" height="8" fill="currentColor" />
          <rect x="52" y="16" width="8" height="8" fill="currentColor" />
          <rect x="68" y="28" width="8" height="8" fill="currentColor" />
          <rect x="52" y="44" width="16" height="8" fill="currentColor" />
          <rect x="76" y="52" width="8" height="16" fill="currentColor" />
          <rect x="44" y="68" width="24" height="8" fill="currentColor" />
          <rect x="84" y="84" width="8" height="8" fill="currentColor" />
          <rect x="100" y="68" width="8" height="8" fill="currentColor" />
          <rect x="60" y="92" width="8" height="16" fill="currentColor" />
        </svg>
      </div>
      <figcaption className="max-w-[220px] text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
