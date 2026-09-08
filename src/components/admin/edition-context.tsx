"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ADMIN_YEARS, DEFAULT_ADMIN_YEAR, editionForYear } from "@/lib/admin";
import type { EventEdition } from "@/types";

const STORAGE_KEY = "wow_admin_edition";

type EditionContextValue = {
  year: number;
  setYear: (year: number) => void;
  edition: EventEdition;
};

const EditionContext = createContext<EditionContextValue | null>(null);

function readStoredYear(): number {
  if (typeof window === "undefined") return DEFAULT_ADMIN_YEAR;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : DEFAULT_ADMIN_YEAR;
  return ADMIN_YEARS.includes(parsed as (typeof ADMIN_YEARS)[number])
    ? parsed
    : DEFAULT_ADMIN_YEAR;
}

export function EditionProvider({ children }: { children: React.ReactNode }) {
  const [year, setYearState] = useState<number>(DEFAULT_ADMIN_YEAR);

  useEffect(() => {
    const id = window.setTimeout(() => setYearState(readStoredYear()), 0);
    return () => window.clearTimeout(id);
  }, []);

  const setYear = (next: number) => {
    const safe = ADMIN_YEARS.includes(next as (typeof ADMIN_YEARS)[number])
      ? next
      : DEFAULT_ADMIN_YEAR;
    setYearState(safe);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(safe));
    }
  };

  const edition = useMemo(() => editionForYear(year), [year]);
  const value = useMemo(() => ({ year, setYear, edition }), [edition, year]);

  return <EditionContext.Provider value={value}>{children}</EditionContext.Provider>;
}

export function useEdition() {
  const ctx = useContext(EditionContext);
  if (!ctx) throw new Error("useEdition must be used within EditionProvider");
  return ctx;
}
