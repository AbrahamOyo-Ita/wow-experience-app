import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { prayerRequestSchema } from "../src/lib/prayer-validation.ts";

test("accepts a private prayer request without a name", () => {
  const parsed = prayerRequestSchema.safeParse({
    name: "",
    prayerPoint: "Please pray for wisdom and peace this week.",
    desiredOutcome: "I am trusting God for a clear answer and renewed peace at the event.",
    isAnonymous: true,
    isUrgent: false,
    source: "prayer-page-qr",
  });

  assert.equal(parsed.success, true);
});

test("rejects prayer requests that are too short", () => {
  const parsed = prayerRequestSchema.safeParse({
    name: "",
    prayerPoint: "Help me",
    desiredOutcome: "Peace",
    isAnonymous: true,
    isUrgent: false,
  });

  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.equal(parsed.error.issues[0]?.path[0], "prayerPoint");
  }
});

test("migration keeps prayer rows private while exposing only the submit RPC", () => {
  const sql = [
    readFileSync(
      new URL(
        "../supabase/migrations/20261011191949_prayer_requests.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFileSync(
    new URL(
      "../supabase/migrations/20261011194532_prayer_request_details.sql",
      import.meta.url,
    ),
    "utf8",
    ),
  ].join("\n");

  assert.match(sql, /alter table public\.prayer_requests enable row level security/i);
  assert.match(sql, /revoke all on table public\.prayer_requests from anon, authenticated/i);
  assert.match(sql, /when 'prayer-request' then 120/i);
  assert.match(sql, /grant execute on function public\.submit_prayer_request\(jsonb\) to anon, authenticated/i);
  assert.match(sql, /create policy "admins_select_prayer_requests"/i);
});
