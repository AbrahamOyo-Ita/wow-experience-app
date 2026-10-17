import test from "node:test";
import assert from "node:assert/strict";
import { applyAdjustment, elapsedSeconds, formatTimerSeconds, remainingSeconds, serverOffsetMs, setExactRemaining, timerTone } from "../src/lib/timer/math.ts";
import type { TimerSegment, TimerSession } from "../src/lib/timer/types.ts";

const segment: TimerSegment = { id: "seg", position: 0, title: "Talk", speaker: "Ada", durationSeconds: 600, segmentType: "speaker", notes: "", warningSeconds: 300, autoAdvance: false, overtimeMode: true, elapsedSeconds: 0, adjustmentSeconds: 0, startedAt: null };
const session: TimerSession = { id: "session", publicCode: "public", eventName: "WOW", status: "running", currentSegmentIndex: 0, runningStartedAt: "2026-10-18T06:00:00.000Z", blackout: false, frozen: false, flashMessage: null, displayConfig: { theme: "dark", accent: "#fff", fontSize: "xl", showTitle: true, showSpeaker: true, showClock: true, showProgress: true, showNext: true, soundEnabled: false, warningSeconds: 300, redSeconds: 60 }, updatedAt: "2026-10-18T06:00:00.000Z", serverNow: "2026-10-18T06:00:00.000Z", segments: [segment] };

test("timer math accounts for running time and overtime", () => {
  const now = Date.parse("2026-10-18T06:10:30.000Z");
  assert.equal(Math.floor(elapsedSeconds(segment, session, now)), 630);
  assert.equal(Math.floor(remainingSeconds(segment, session, now)), -30);
  assert.equal(formatTimerSeconds(-30), "+00:30");
  assert.equal(timerTone(segment, session, now), "overtime");
});

test("paused time does not advance and adjustments are auditable", () => {
  const paused = { ...session, status: "paused" as const, runningStartedAt: null };
  assert.equal(elapsedSeconds({ ...segment, elapsedSeconds: 120 }, paused, Date.now()), 120);
  assert.equal(applyAdjustment(segment, 120).durationSeconds, 720);
  assert.equal(setExactRemaining({ ...segment, elapsedSeconds: 120 }, paused, 60, Date.now()).durationSeconds, 180);
});

test("server offset is explicit", () => {
  assert.equal(serverOffsetMs("2026-10-18T06:00:01.000Z", Date.parse("2026-10-18T06:00:00.000Z")), 1000);
});
