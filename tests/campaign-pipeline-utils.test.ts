import test from "node:test";
import assert from "node:assert/strict";
import { isValidEmail, parseLagosDateTime, renderCampaignTemplate } from "../src/lib/notifications/campaign-pipeline-utils.ts";

test("validates and renders campaign recipients safely", () => {
  assert.equal(isValidEmail("person@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(renderCampaignTemplate("Hi {{first_name}} at {{event_name}}", { first_name: "Ada", event_name: "WOW" }), "Hi Ada at WOW");
});

test("interprets datetime-local campaign schedules as Africa/Lagos", () => {
  assert.equal(parseLagosDateTime("2026-10-18T07:00")?.toISOString(), "2026-10-18T06:00:00.000Z");
});
