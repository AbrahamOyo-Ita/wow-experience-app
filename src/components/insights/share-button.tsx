"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outlineDark"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (typeof navigator.share === "function") {
            await navigator.share({ title, url });
            return;
          }
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(`${title} ${url}`);
          } else {
            window.prompt("Copy this link", url);
          }
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2500);
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          try {
            if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(`${title} ${url}`);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2500);
            } else {
              window.prompt("Copy this link", url);
            }
          } catch {
            window.prompt("Copy this link", url);
          }
        }
      }}
    >
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
