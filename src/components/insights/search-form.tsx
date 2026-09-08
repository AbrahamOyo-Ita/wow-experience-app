"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";

export function InsightsSearchForm({
  query,
  category,
}: {
  query: string;
  category: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (value.trim()) params.set("q", value.trim());
        if (category && category !== "All") params.set("category", category);
        const suffix = params.toString();
        router.push(suffix ? `/insights?${suffix}` : "/insights");
      }}
    >
      <label htmlFor="insights-q" className="sr-only">
        Search insights
      </label>
      <TextInput
        id="insights-q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search titles and writing"
        className="sm:max-w-sm"
      />
      <Button type="submit" variant="outlineDark">
        Search
      </Button>
    </form>
  );
}
