"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DUPLICATE_WINDOW_MS = 2_000;

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || navigator.doNotTrack === "1") return;

    const url = new URL(window.location.href);
    const pageKey = `${url.pathname}${url.search}`;
    const now = Date.now();
    const previous = sessionStorage.getItem("wow:last-page-view");
    if (previous) {
      const [lastKey, timestamp] = previous.split("|");
      if (lastKey === pageKey && now - Number(timestamp) < DUPLICATE_WINDOW_MS) return;
    }
    sessionStorage.setItem("wow:last-page-view", `${pageKey}|${now}`);

    const body = JSON.stringify({
      path: url.pathname,
      referrer: document.referrer || null,
      utmSource: url.searchParams.get("utm_source"),
      utmMedium: url.searchParams.get("utm_medium"),
      utmCampaign: url.searchParams.get("utm_campaign"),
    });

    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}

