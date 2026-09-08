"use client";

import { Button } from "@/components/ui/button";

export function openRsvpModal(step: "decision" | "form" = "form") {
  window.dispatchEvent(new CustomEvent("wow:open-rsvp", { detail: { step } }));
}

export function OpenRsvpButton({
  children = "I'll attend",
  variant = "primary",
  className,
}: {
  children?: React.ReactNode;
  variant?: "primary" | "inverse" | "outlineLight" | "outlineDark";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => openRsvpModal("form")}
    >
      {children}
    </Button>
  );
}
