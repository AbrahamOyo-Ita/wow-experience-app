import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FLYER_CONFIG, flyerFileSlug, flyerTemplateConfigSchema, pushHistory, redoHistory, undoHistory } from "../src/lib/flyer-template.ts";
import { calculateAutoFitFontSize } from "../src/lib/canvas-utils.ts";

test("accepts the normalized seed geometry", () => {
  assert.equal(flyerTemplateConfigSchema.parse(DEFAULT_FLYER_CONFIG).baseWidth, 2000);
});

test("rejects photo and text geometry outside the design", () => {
  const invalidCircle = structuredClone(DEFAULT_FLYER_CONFIG);
  invalidCircle.photoArea.cx = 0.05;
  assert.equal(flyerTemplateConfigSchema.safeParse(invalidCircle).success, false);
  const invalidText = structuredClone(DEFAULT_FLYER_CONFIG);
  invalidText.textArea.x = 0.9;
  assert.equal(flyerTemplateConfigSchema.safeParse(invalidText).success, false);
});

test("undo and redo retain at least fifty committed edits", () => {
  let history = { past: [] as number[], present: 0, future: [] as number[] };
  for (let index = 1; index <= 60; index += 1) history = pushHistory(history, index, 50);
  assert.equal(history.past.length, 50);
  history = undoHistory(history);
  assert.equal(history.present, 59);
  history = redoHistory(history);
  assert.equal(history.present, 60);
});

test("auto-fit reduces long names and stays inside configured bounds", () => {
  const size = calculateAutoFitFontSize("A very long attendee name", DEFAULT_FLYER_CONFIG.textArea, 2000, 2500, (fontSize, value) => value.length * fontSize * 0.58);
  assert.ok(size >= DEFAULT_FLYER_CONFIG.textArea.minFontSize);
  assert.ok(size < DEFAULT_FLYER_CONFIG.textArea.maxFontSize);
});

test("export filenames are normalized and safe", () => {
  assert.equal(flyerFileSlug("  Chidí <Okon> / 2026  "), "chidi-okon-2026");
  assert.equal(flyerFileSlug("<>"), "guest");
});
