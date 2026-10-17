"use client";

import { Maximize2, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTimerSeconds, progressPercent, remainingSeconds, serverOffsetMs, timerTone } from "@/lib/timer/math";
import type { TimerDisplayConfig, TimerSegment, TimerSession } from "@/lib/timer/types";

type PublicPayload = Record<string, unknown> & { session_id: string; public_code: string; segments: Record<string, unknown>[]; display_config: Record<string, unknown>; serverNow: string };

function normalize(payload: PublicPayload): TimerSession {
  return {
    id: payload.session_id, publicCode: payload.public_code, eventName: String(payload.event_name ?? ""), status: payload.status as TimerSession["status"], currentSegmentIndex: Number(payload.current_segment_index ?? 0), runningStartedAt: payload.running_started_at ? String(payload.running_started_at) : null, blackout: Boolean(payload.blackout), frozen: Boolean(payload.frozen), flashMessage: payload.flash_message ? String(payload.flash_message) : null, updatedAt: String(payload.updated_at), serverNow: payload.serverNow,
    displayConfig: { theme: "dark", accent: "#D7A84A", fontSize: "xl", showTitle: true, showSpeaker: true, showClock: true, showProgress: true, showNext: true, soundEnabled: false, warningSeconds: 300, redSeconds: 60, warningColor: "#f4c95d", redColor: "#f87171", overtimeColor: "#ef4444", ...payload.display_config } as TimerDisplayConfig,
    segments: payload.segments.map((row) => ({ id: String(row.id), position: Number(row.position), title: String(row.title ?? ""), speaker: String(row.speaker ?? ""), durationSeconds: Number(row.durationSeconds ?? row.duration_seconds ?? 600), segmentType: String(row.segmentType ?? "custom") as TimerSegment["segmentType"], notes: "", warningSeconds: Number(row.warningSeconds ?? row.warning_seconds ?? 300), autoAdvance: Boolean(row.autoAdvance ?? row.auto_advance), overtimeMode: Boolean(row.overtimeMode ?? row.overtime_mode), elapsedSeconds: Number(row.elapsedSeconds ?? row.elapsed_seconds ?? 0), adjustmentSeconds: Number(row.adjustmentSeconds ?? row.adjustment_seconds ?? 0), startedAt: row.startedAt ? String(row.startedAt) : row.started_at ? String(row.started_at) : null })),
  };
}

export function TimerPresentScreen({ publicCode }: { publicCode: string }) {
  const [session, setSession] = useState<TimerSession | null>(null);
  const [offline, setOffline] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hiddenCursor, setHiddenCursor] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  const lastTone = useRef<string | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/timer/state?session=${encodeURIComponent(publicCode)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("offline");
      const payload = await response.json() as PublicPayload;
      setSession(normalize(payload)); setOffset(serverOffsetMs(payload.serverNow)); setOffline(false);
    } catch { setOffline(true); }
  }, [publicCode]);

  useEffect(() => { const initial = window.setTimeout(() => void refresh(), 0); const timer = window.setInterval(() => void refresh(), 2000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [refresh]);
  useEffect(() => {
    if (!session?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`timer-present-${session.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "timer_sessions", filter: `id=eq.${session.id}` }, () => void refresh()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [session?.id, refresh]);
  useEffect(() => {
    const channel = new BroadcastChannel("wow-event-timer");
    const announce = () => channel.postMessage({ type: "present-online", publicCode });
    channel.onmessage = (event) => { if (event.data?.type === "timer-changed" && event.data.publicCode === publicCode) void refresh(); };
    announce(); const timer = window.setInterval(announce, 2000);
    return () => { window.clearInterval(timer); channel.close(); };
  }, [publicCode, refresh]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key.toLowerCase() === "f") { const request = document.documentElement.requestFullscreen?.(); if (request) void request.catch(() => undefined); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const onMove = () => { setHiddenCursor(false); window.clearTimeout((onMove as unknown as { timer?: number }).timer); (onMove as unknown as { timer?: number }).timer = window.setTimeout(() => setHiddenCursor(true), 3000); };
    window.addEventListener("mousemove", onMove); window.addEventListener("keydown", onMove); onMove();
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("keydown", onMove); };
  }, []);
  useEffect(() => {
    const requestWakeLock = async () => { try { wakeLock.current = await navigator.wakeLock?.request("screen") ?? null; } catch { /* browser policy */ } };
    void requestWakeLock();
    const onVisible = () => { if (document.visibilityState === "visible") void requestWakeLock(); };
    document.addEventListener("visibilitychange", onVisible); return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const current = session?.segments[session.currentSegmentIndex];
  const displayNow = session?.frozen ? Date.parse(session.updatedAt) : now + offset;
  const remaining = current && session ? remainingSeconds(current, session, displayNow) : 0;
  const tone = current && session ? timerTone(current, session, displayNow, session.displayConfig.redSeconds) : "normal";
  const progress = current && session ? progressPercent(current, session, displayNow) : 0;

  useEffect(() => {
    if (!session || !current || !soundEnabled || !session.displayConfig.soundEnabled || tone === lastTone.current || !["amber", "red", "overtime"].includes(tone)) return;
    lastTone.current = tone;
    try { const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.connect(gain); gain.connect(context.destination); oscillator.frequency.value = tone === "overtime" ? 220 : 660; gain.gain.value = 0.06; oscillator.start(); oscillator.stop(context.currentTime + 0.18); } catch { /* optional alert */ }
  }, [current, session, soundEnabled, tone]);

  const config = session?.displayConfig;
  const themeClass = config?.theme === "light" ? "bg-[#f6f4ee] text-[#181713]" : config?.theme === "high-contrast" ? "bg-black text-white" : "bg-[#11110f] text-white";
  const accent = config?.accent ?? "#D7A84A";
  const next = session?.segments[(session.currentSegmentIndex ?? 0) + 1];
  const fullscreen = () => { const request = document.documentElement.requestFullscreen?.(); if (request) void request.catch(() => undefined); };
  const toneColor = tone === "overtime" ? config?.overtimeColor : tone === "red" ? config?.redColor : tone === "amber" ? config?.warningColor : undefined;

  if (!session) return <main className="grid min-h-screen place-items-center bg-[#11110f] text-white"><div className="text-center"><div className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-300">Timer</div><p>{offline ? "Reconnecting to timer…" : "Loading timer…"}</p></div></main>;
  if (session.blackout) return <main className="min-h-screen bg-black" aria-label="Timer blackout" />;
  return <main className={`${themeClass} relative flex min-h-screen flex-col overflow-hidden transition-colors duration-500 ${hiddenCursor ? "cursor-none" : ""}`} style={{ "--timer-accent": accent } as CSSProperties}>
    <div className="absolute right-5 top-5 z-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em] opacity-70">
      <span className={offline ? "text-red-400" : "text-emerald-300"}>{offline ? "Offline" : "Live"}</span>
      <button type="button" onClick={fullscreen} className="rounded-full p-2 opacity-0 transition hover:bg-white/10 focus-visible:opacity-100 group-hover:opacity-100" aria-label="Enter fullscreen"><Maximize2 className="h-4 w-4" /></button>
    </div>
    <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center px-6 py-16 text-center sm:px-12 lg:px-20">
      {config?.showTitle && <div className="mb-6 text-sm uppercase tracking-[0.45em] opacity-60 sm:text-lg">{session.eventName}</div>}
      {config?.logoUrl && <img src={config.logoUrl} alt="" className="mx-auto mb-6 max-h-16 max-w-56 object-contain" />}
      {config?.showTitle && <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl" style={{ color: accent }}>{current?.title ?? "Ready"}</h1>}
      {config?.showSpeaker && current?.speaker && <p className="mt-3 text-lg opacity-70 sm:text-2xl">{current.speaker}</p>}
      {config?.showClock && <div className="mt-10 font-mono text-[clamp(5rem,18vw,16rem)] font-semibold leading-none tracking-[-0.08em] tabular-nums" style={{ color: toneColor }}>{formatTimerSeconds(current?.overtimeMode ? remaining : Math.max(0, remaining))}</div>}
      {config?.showProgress && <div className="mx-auto mt-10 h-2 w-full max-w-5xl overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${progress}%`, backgroundColor: toneColor ?? accent }} /></div>}
      {config?.showNext && next && <div className="mt-10 text-sm opacity-50">Up next · <span className="font-semibold opacity-100">{next.title}</span>{next.speaker ? ` — ${next.speaker}` : ""}</div>}
      {session.flashMessage && <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-xl font-semibold backdrop-blur sm:text-3xl">{session.flashMessage}</div>}
    </div>
    {!soundEnabled && session.displayConfig.soundEnabled && <button type="button" onClick={() => setSoundEnabled(true)} className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur"><Volume2 className="mr-2 inline h-4 w-4" />Enable sound</button>}
  </main>;
}
