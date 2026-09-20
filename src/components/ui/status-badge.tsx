import type { VolunteerStatus } from "@/types";
import { cn } from "@/lib/utils";

const volunteerStyles: Record<VolunteerStatus, string> = {
  submitted: "bg-paper text-ink",
  under_review: "bg-ink text-white",
  accepted: "bg-red text-white",
  waitlisted: "border border-ink/20 text-ink",
  declined: "bg-red-soft text-red-deep",
};

const volunteerLabels: Record<VolunteerStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  declined: "Declined",
};

export function VolunteerStatusBadge({ status }: { status: VolunteerStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
        volunteerStyles[status],
      )}
    >
      {volunteerLabels[status]}
    </span>
  );
}

export function StatusDot({
  tone,
  label,
}: {
  tone: "ok" | "warn" | "bad" | "idle";
  label: string;
}) {
  const color =
    tone === "ok"
      ? "bg-emerald-700"
      : tone === "warn"
        ? "bg-red"
        : tone === "bad"
          ? "bg-red-deep"
          : "bg-muted";
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={cn("h-2 w-2 rounded-full", color)} aria-hidden />
      {label}
    </span>
  );
}
