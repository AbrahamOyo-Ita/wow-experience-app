import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckInForm } from "@/components/attend/check-in-form";
import { getEditionByYear } from "@/data/editions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Check-in ${year}`,
    robots: { index: false, follow: false },
  };
}

export async function generateStaticParams() {
  return [{ year: "2025" }, { year: "2026" }, { year: "2027" }];
}

export default async function AttendPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const edition = getEditionByYear(Number(year));
  if (!edition) notFound();

  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-md text-sm text-muted">Preparing check-in…</p>
      }
    >
      <CheckInForm edition={edition} />
    </Suspense>
  );
}
