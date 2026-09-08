"use client";

import { usePathname } from "next/navigation";
import { RsvpModal } from "@/components/rsvp/modal";

export function RsvpModalHost() {
  const pathname = usePathname();
  return <RsvpModal pathname={pathname} />;
}
