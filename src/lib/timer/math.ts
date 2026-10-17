import type { TimerSegment, TimerSession } from "./types";

export function elapsedSeconds(segment: TimerSegment, session: TimerSession, nowMs: number) {
  const base = Math.max(0, segment.elapsedSeconds);
  if (session.status !== "running" || session.currentSegmentIndex !== segment.position || !session.runningStartedAt) return base;
  return base + Math.max(0, nowMs - Date.parse(session.runningStartedAt)) / 1000;
}

export function remainingSeconds(segment: TimerSegment, session: TimerSession, nowMs: number) {
  return segment.durationSeconds - elapsedSeconds(segment, session, nowMs);
}

export function progressPercent(segment: TimerSegment, session: TimerSession, nowMs: number) {
  return Math.min(100, Math.max(0, (elapsedSeconds(segment, session, nowMs) / segment.durationSeconds) * 100));
}

export function timerTone(segment: TimerSegment, session: TimerSession, nowMs: number, redSeconds = 60) {
  const remaining = remainingSeconds(segment, session, nowMs);
  if (remaining <= 0) return segment.overtimeMode ? "overtime" as const : "normal" as const;
  if (remaining <= redSeconds) return "red" as const;
  if (remaining <= segment.warningSeconds) return "amber" as const;
  return "normal" as const;
}

export function formatTimerSeconds(value: number) {
  const sign = value < 0 ? "+" : "";
  const total = Math.abs(Math.floor(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${sign}${hours > 0 ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function applyAdjustment(segment: TimerSegment, amountSeconds: number): TimerSegment {
  return { ...segment, durationSeconds: Math.max(1, segment.durationSeconds + amountSeconds), adjustmentSeconds: segment.adjustmentSeconds + amountSeconds };
}

export function setExactRemaining(segment: TimerSegment, session: TimerSession, remaining: number, nowMs: number): TimerSegment {
  const elapsed = elapsedSeconds(segment, session, nowMs);
  const nextDuration = Math.max(1, Math.ceil(elapsed + remaining));
  return { ...segment, durationSeconds: nextDuration, adjustmentSeconds: segment.adjustmentSeconds + nextDuration - segment.durationSeconds };
}

export function serverOffsetMs(serverNow: string, clientNow = Date.now()) {
  return Date.parse(serverNow) - clientNow;
}
