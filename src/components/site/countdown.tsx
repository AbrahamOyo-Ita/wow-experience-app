"use client";

import { useEffect, useState } from "react";
import type { EventEdition } from "@/types";

type CountdownParts = ReturnType<typeof partsUntil>;

function partsUntil(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalHours = Math.floor(diff / 36e5);
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    minutes: Math.floor((diff % 36e5) / 6e4),
    seconds: Math.floor((diff % 6e4) / 1000),
    done: diff <= 0,
  };
}

export function Countdown({
  edition,
  variant = "light",
}: {
  edition: EventEdition;
  variant?: "light" | "dark";
}) {
  const [time, setTime] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const target = new Date(edition.startsAt);
    const update = () => setTime(partsUntil(target));
    const first = window.setTimeout(update, 0);
    const id = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [edition.startsAt]);

  const label = variant === "dark" ? "text-white/70" : "text-muted";
  const num = variant === "dark" ? "text-white" : "text-ink";

  if (edition.status === "completed" || time?.done) {
    return (
      <p className={`text-sm ${label}`}>
        {edition.status === "completed"
          ? "This edition has closed."
          : "The gathering is underway."}
      </p>
    );
  }

  const cells = [
    { n: time?.days ?? 0, l: "Days" },
    { n: time?.hours ?? 0, l: "Hours" },
    { n: time?.minutes ?? 0, l: "Minutes" },
    { n: time?.seconds ?? 0, l: "Seconds" },
  ];

  return (
    <div className="flex gap-4 sm:gap-6" aria-live="polite">
      {cells.map((cell) => (
        <div key={cell.l} className="min-w-14">
          <div className={`font-display text-3xl font-bold tabular-nums sm:text-4xl ${num}`}>
            {String(cell.n).padStart(2, "0")}
          </div>
          <div className={`mt-1 text-[0.7rem] tracking-[0.14em] uppercase ${label}`}>
            {cell.l}
          </div>
        </div>
      ))}
    </div>
  );
}
