import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Minister } from "@/types";

type MinisterRow = Record<string, unknown> & {
  event_editions?: { legacy_key?: string } | Array<{ legacy_key?: string }> | null;
};

export function mapMinister(row: MinisterRow): Minister {
  const edition = Array.isArray(row.event_editions)
    ? row.event_editions[0]
    : row.event_editions;

  return {
    id: String(row.id),
    editionId: String(edition?.legacy_key ?? row.edition_id),
    name: String(row.name),
    role: String(row.role ?? ""),
    bio: String(row.bio ?? ""),
    imageSrc: String(row.image_src ?? ""),
    imageAlt: String(row.image_alt ?? `Portrait of ${row.name}`),
    featured: Boolean(row.featured),
    published: Boolean(row.is_published),
    order: Number(row.sort_order ?? 1),
  };
}

export async function getHomepageMinisters(editionId: string): Promise<Minister[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ministers")
    .select("*, event_editions!inner(legacy_key)")
    .eq("event_editions.legacy_key", editionId)
    .eq("is_published", true)
    .eq("featured", true)
    .order("sort_order");

  if (error) return [];
  return ((data as MinisterRow[] | null) ?? []).map(mapMinister);
}
